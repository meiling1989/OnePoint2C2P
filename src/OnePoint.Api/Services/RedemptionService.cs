using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles point redemption transactions: balance validation, atomic debit/credit,
/// transaction logging, and paginated history queries.
/// </summary>
public class RedemptionService
{
    private readonly NpgsqlConnection _db;

    public RedemptionService(NpgsqlConnection db)
    {
        string _connectionString = "Host=aws-1-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Pooling=true;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
        _db = new NpgsqlConnection(_connectionString);
    }

    /// <summary>
    /// Process a point redemption: validate balance, debit consumer, credit merchant,
    /// log the transaction, and create a notification — all within a single DB transaction.
    /// </summary>
    public async Task<RedemptionResult> ProcessRedemption(
        Guid consumerId, Guid merchantId, decimal amount, string method)
    {
        if (amount <= 0)
            throw new ValidationException("Amount must be positive.");

        if (method is not ("qr_code" or "user_id"))
            throw new ValidationException("Method must be 'qr_code' or 'user_id'.");

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();
        await using var tx = await _db.BeginTransactionAsync();

        try
        {
            // 1. Lock and read consumer balance
            var consumer = await _db.QuerySingleOrDefaultAsync<Consumer>(
                """
                SELECT id AS Id, phone_number AS PhoneNumber, display_name AS DisplayName,
                       onepoint_balance AS OnepointBalance, qr_code_data AS QrCodeData,
                       is_active AS IsActive, created_at AS CreatedAt
                FROM consumers WHERE id = @Id AND is_active = true
                FOR UPDATE
                """,
                new { Id = consumerId }, tx);

            if (consumer is null)
                throw new NotFoundException("Consumer not found or inactive.");

            if (consumer.OnepointBalance < amount)
                throw new InsufficientBalanceException(consumer.OnepointBalance);

            // 2. Verify merchant exists and is active
            var merchantExists = await _db.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = @Id AND is_active = true)",
                new { Id = merchantId }, tx);

            if (!merchantExists)
                throw new NotFoundException("Merchant not found or inactive.");

            // 3. Generate unique transaction ref
            var transactionRef = $"TXN-{Guid.NewGuid():N}"[..20];

            // 4. Debit consumer
            await _db.ExecuteAsync(
                "UPDATE consumers SET onepoint_balance = onepoint_balance - @Amount WHERE id = @Id",
                new { Amount = amount, Id = consumerId }, tx);

            // 5. Credit merchant
            await _db.ExecuteAsync(
                "UPDATE merchants SET settlement_balance = settlement_balance + @Amount WHERE id = @Id",
                new { Amount = amount, Id = merchantId }, tx);

            // 6. Insert transaction record
            await _db.ExecuteAsync(
                """
                INSERT INTO redemption_transactions
                    (transaction_ref, consumer_id, merchant_id, points_redeemed, monetary_value, method, status)
                VALUES (@Ref, @ConsumerId, @MerchantId, @Points, @Monetary, @Method, 'approved')
                """,
                new
                {
                    Ref = transactionRef,
                    ConsumerId = consumerId,
                    MerchantId = merchantId,
                    Points = amount,
                    Monetary = amount, // 1:1 for MVP
                    Method = method
                }, tx);

            // 7. Insert notification
            await _db.ExecuteAsync(
                """
                INSERT INTO notifications (consumer_id, category, title, body)
                VALUES (@ConsumerId, 'redemption', @Title, @Body)
                """,
                new
                {
                    ConsumerId = consumerId,
                    Title = "Points Redeemed",
                    Body = $"{amount} points redeemed at merchant. Ref: {transactionRef}"
                }, tx);

            await tx.CommitAsync();

            var updatedBalance = consumer.OnepointBalance - amount;
            return new RedemptionResult(transactionRef, "approved", amount, amount, updatedBalance);
        }
        catch (Exception) when (tx.Connection is not null)
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Reverse a failed redemption: restore consumer balance, update transaction status.
    /// </summary>
    public async Task ReverseRedemption(string transactionRef)
    {
        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();
        await using var tx = await _db.BeginTransactionAsync();

        try
        {
            var redemption = await _db.QuerySingleOrDefaultAsync<RedemptionTransaction>(
                """
                SELECT id AS Id, transaction_ref AS TransactionRef, consumer_id AS ConsumerId,
                       merchant_id AS MerchantId, points_redeemed AS PointsRedeemed,
                       monetary_value AS MonetaryValue, method AS Method, status AS Status,
                       created_at AS CreatedAt
                FROM redemption_transactions WHERE transaction_ref = @Ref
                FOR UPDATE
                """,
                new { Ref = transactionRef }, tx);

            if (redemption is null)
                throw new NotFoundException("Transaction not found.");

            if (redemption.Status != "approved")
                throw new ValidationException("Only approved transactions can be reversed.");

            // Restore consumer balance
            await _db.ExecuteAsync(
                "UPDATE consumers SET onepoint_balance = onepoint_balance + @Amount WHERE id = @Id",
                new { Amount = redemption.PointsRedeemed, Id = redemption.ConsumerId }, tx);

            // Debit merchant settlement
            await _db.ExecuteAsync(
                "UPDATE merchants SET settlement_balance = settlement_balance - @Amount WHERE id = @Id",
                new { Amount = redemption.MonetaryValue, Id = redemption.MerchantId }, tx);

            // Mark as reversed
            await _db.ExecuteAsync(
                "UPDATE redemption_transactions SET status = 'reversed' WHERE id = @Id",
                new { Id = redemption.Id }, tx);

            await tx.CommitAsync();
        }
        catch (Exception) when (tx.Connection is not null)
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Paginated, filterable, sortable transaction history.
    /// </summary>
    public async Task<PagedResult<RedemptionTransaction>> GetTransactions(
        TransactionFilter filter, int page = 1, int pageSize = 20,
        string sortBy = "date", string sortDir = "desc")
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var where = "WHERE 1=1";
        var parameters = new DynamicParameters();

        if (filter.ConsumerId.HasValue)
        {
            where += " AND rt.consumer_id = @ConsumerId";
            parameters.Add("ConsumerId", filter.ConsumerId.Value);
        }
        if (filter.MerchantId.HasValue)
        {
            where += " AND rt.merchant_id = @MerchantId";
            parameters.Add("MerchantId", filter.MerchantId.Value);
        }
        if (filter.FromDate.HasValue)
        {
            where += " AND rt.created_at >= @FromDate";
            parameters.Add("FromDate", filter.FromDate.Value);
        }
        if (filter.ToDate.HasValue)
        {
            where += " AND rt.created_at <= @ToDate";
            parameters.Add("ToDate", filter.ToDate.Value);
        }
        if (!string.IsNullOrEmpty(filter.Status))
        {
            where += " AND rt.status = @Status";
            parameters.Add("Status", filter.Status);
        }
        if (filter.MinAmount.HasValue)
        {
            where += " AND rt.points_redeemed >= @MinAmount";
            parameters.Add("MinAmount", filter.MinAmount.Value);
        }

        // Validate and map sort column
        var orderColumn = sortBy?.ToLowerInvariant() switch
        {
            "amount" => "rt.points_redeemed",
            "status" => "rt.status",
            _ => "rt.created_at" // default: date
        };
        var orderDir = sortDir?.ToLowerInvariant() == "asc" ? "ASC" : "DESC";

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var countSql = $"SELECT COUNT(*) FROM redemption_transactions rt {where}";
        var totalCount = await _db.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", offset);

        var dataSql = $"""
            SELECT id AS Id, transaction_ref AS TransactionRef, consumer_id AS ConsumerId,
                   merchant_id AS MerchantId, points_redeemed AS PointsRedeemed,
                   monetary_value AS MonetaryValue, method AS Method, status AS Status,
                   created_at AS CreatedAt
            FROM redemption_transactions rt
            {where}
            ORDER BY {orderColumn} {orderDir}
            LIMIT @Limit OFFSET @Offset
            """;

        var items = (await _db.QueryAsync<RedemptionTransaction>(dataSql, parameters)).ToList();

        return new PagedResult<RedemptionTransaction>(items, page, pageSize, totalCount);
    }
}
