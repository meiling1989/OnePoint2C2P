using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles point swaps between partner programs via OnePoint intermediary.
/// Conversion: target_amount = source_amount × rate_to_onepoint × rate_from_onepoint
/// </summary>
public class SwapService
{
    private readonly NpgsqlConnection _db;

    public SwapService(NpgsqlConnection db) => _db = db;

    /// <summary>
    /// Calculate a swap preview: look up both partner programs, validate they are active,
    /// and compute the conversion through the OnePoint intermediary.
    /// </summary>
    public async Task<SwapPreview> CalculateSwap(
        string sourceProgram, string targetProgram, decimal amount)
    {
        if (amount <= 0)
            throw new ValidationException("Swap amount must be positive.");

        if (sourceProgram == targetProgram)
            throw new ValidationException("Source and target programs must be different.");

        await _db.OpenAsync();

        // Look up source partner program
        var source = await _db.QuerySingleOrDefaultAsync<PartnerProgram>(
            """
            SELECT id AS Id, name AS Name, rate_to_onepoint AS RateToOnepoint,
                   rate_from_onepoint AS RateFromOnepoint, is_active AS IsActive
            FROM partner_programs WHERE id = @Id
            """,
            new { Id = sourceProgram });

        if (source is null)
            throw new NotFoundException($"Source partner program '{sourceProgram}' not found.");

        if (!source.IsActive)
            throw new ValidationException($"Source partner program '{sourceProgram}' is not active.");

        // Look up target partner program
        var target = await _db.QuerySingleOrDefaultAsync<PartnerProgram>(
            """
            SELECT id AS Id, name AS Name, rate_to_onepoint AS RateToOnepoint,
                   rate_from_onepoint AS RateFromOnepoint, is_active AS IsActive
            FROM partner_programs WHERE id = @Id
            """,
            new { Id = targetProgram });

        if (target is null)
            throw new NotFoundException($"Target partner program '{targetProgram}' not found.");

        if (!target.IsActive)
            throw new ValidationException($"Target partner program '{targetProgram}' is not active.");

        // Compute conversion through OnePoint intermediary
        var onepointIntermediate = amount * source.RateToOnepoint;
        var targetAmount = onepointIntermediate * target.RateFromOnepoint;

        return new SwapPreview(amount, onepointIntermediate, targetAmount, sourceProgram, targetProgram);
    }

    /// <summary>
    /// Execute a confirmed swap: debit source partner_link, credit target partner_link,
    /// log the swap transaction, and create a notification — all within a single DB transaction.
    /// </summary>
    public async Task<SwapResult> ExecuteSwap(Guid consumerId, SwapPreview preview)
    {
        await _db.OpenAsync();
        await using var tx = await _db.BeginTransactionAsync();

        try
        {
            // 1. Verify consumer exists and is active
            var consumerExists = await _db.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM consumers WHERE id = @Id AND is_active = true)",
                new { Id = consumerId }, tx);

            if (!consumerExists)
                throw new NotFoundException("Consumer not found or inactive.");

            // 2. Lock and check source partner_link has sufficient cached_balance
            var sourceBalance = await _db.QuerySingleOrDefaultAsync<decimal?>(
                """
                SELECT cached_balance
                FROM partner_links
                WHERE consumer_id = @ConsumerId AND program_id = @ProgramId
                FOR UPDATE
                """,
                new { ConsumerId = consumerId, ProgramId = preview.SourceProgram }, tx);

            if (sourceBalance is null)
                throw new NotFoundException(
                    $"Consumer has no linked account for program '{preview.SourceProgram}'.");

            if (sourceBalance.Value < preview.SourceAmount)
                throw new InsufficientBalanceException(sourceBalance.Value);

            // 3. Lock target partner_link (must also exist)
            var targetExists = await _db.ExecuteScalarAsync<bool>(
                """
                SELECT EXISTS(
                    SELECT 1 FROM partner_links
                    WHERE consumer_id = @ConsumerId AND program_id = @ProgramId
                )
                """,
                new { ConsumerId = consumerId, ProgramId = preview.TargetProgram }, tx);

            if (!targetExists)
                throw new NotFoundException(
                    $"Consumer has no linked account for program '{preview.TargetProgram}'.");

            // 4. Debit source partner_link cached_balance
            await _db.ExecuteAsync(
                """
                UPDATE partner_links
                SET cached_balance = cached_balance - @Amount
                WHERE consumer_id = @ConsumerId AND program_id = @ProgramId
                """,
                new { Amount = preview.SourceAmount, ConsumerId = consumerId, ProgramId = preview.SourceProgram }, tx);

            // 5. Credit target partner_link cached_balance
            await _db.ExecuteAsync(
                """
                UPDATE partner_links
                SET cached_balance = cached_balance + @Amount
                WHERE consumer_id = @ConsumerId AND program_id = @ProgramId
                """,
                new { Amount = preview.TargetAmount, ConsumerId = consumerId, ProgramId = preview.TargetProgram }, tx);

            // 6. Insert swap_transactions record
            var swapId = await _db.QuerySingleAsync<Guid>(
                """
                INSERT INTO swap_transactions
                    (consumer_id, source_program_id, target_program_id,
                     source_amount, onepoint_intermediate, target_amount, status)
                VALUES (@ConsumerId, @SourceProgram, @TargetProgram,
                        @SourceAmount, @OnepointIntermediate, @TargetAmount, 'completed')
                RETURNING id
                """,
                new
                {
                    ConsumerId = consumerId,
                    SourceProgram = preview.SourceProgram,
                    TargetProgram = preview.TargetProgram,
                    SourceAmount = preview.SourceAmount,
                    OnepointIntermediate = preview.OnepointIntermediate,
                    TargetAmount = preview.TargetAmount
                }, tx);

            // 7. Insert notification
            await _db.ExecuteAsync(
                """
                INSERT INTO notifications (consumer_id, category, title, body)
                VALUES (@ConsumerId, 'swap', @Title, @Body)
                """,
                new
                {
                    ConsumerId = consumerId,
                    Title = "Points Swapped",
                    Body = $"Swapped {preview.SourceAmount} points from {preview.SourceProgram} to {preview.TargetProgram}. You received {preview.TargetAmount} points."
                }, tx);

            await tx.CommitAsync();

            return new SwapResult(swapId, "completed", preview.SourceAmount, preview.TargetAmount);
        }
        catch (Exception) when (tx.Connection is not null)
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
