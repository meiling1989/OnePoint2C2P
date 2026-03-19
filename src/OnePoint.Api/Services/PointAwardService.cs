using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Awards loyalty points to consumers based on merchant-specific rules.
/// Calculation: floor(purchaseAmount / threshold) * pointsValue
/// </summary>
public class PointAwardService
{
    private readonly NpgsqlConnection _db;

    public PointAwardService(NpgsqlConnection db)
    {
        string _connectionString = "Host=aws-1-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Pooling=true;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
        _db = new NpgsqlConnection(_connectionString);
    }

    /// <summary>
    /// Award points for a purchase: look up active loyalty rule, calculate points,
    /// credit consumer balance, log the event, and create a notification.
    /// </summary>
    public async Task<AwardResult> AwardPoints(
        Guid consumerId, Guid merchantId, decimal purchaseAmount)
    {
        if (purchaseAmount <= 0)
            throw new ValidationException("Purchase amount must be positive.");

        await _db.OpenAsync();
        await using var tx = await _db.BeginTransactionAsync();

        try
        {
            // 1. Verify consumer exists and is active
            var consumerBalance = await _db.QuerySingleOrDefaultAsync<decimal?>(
                """
                SELECT onepoint_balance
                FROM consumers WHERE id = @Id AND is_active = true
                FOR UPDATE
                """,
                new { Id = consumerId }, tx);

            if (consumerBalance is null)
                throw new NotFoundException("Consumer not found or inactive.");

            // 2. Look up active loyalty rule for merchant
            var rule = await _db.QuerySingleOrDefaultAsync<LoyaltyRule>(
                """
                SELECT id AS Id, merchant_id AS MerchantId, rule_type AS RuleType,
                       purchase_threshold AS PurchaseThreshold, points_value AS PointsValue,
                       is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
                FROM loyalty_rules
                WHERE merchant_id = @MerchantId AND is_active = true
                LIMIT 1
                """,
                new { MerchantId = merchantId }, tx);

            if (rule is null)
                throw new NoRuleConfiguredException(
                    $"No active loyalty rule configured for merchant {merchantId}.");

            // 3. Calculate points: floor(purchaseAmount / threshold) * value
            var pointsAwarded = Math.Floor(purchaseAmount / rule.PurchaseThreshold) * rule.PointsValue;

            if (pointsAwarded <= 0)
            {
                await tx.CommitAsync();
                return new AwardResult(0, consumerBalance.Value);
            }

            // 4. Credit consumer balance
            await _db.ExecuteAsync(
                "UPDATE consumers SET onepoint_balance = onepoint_balance + @Points WHERE id = @Id",
                new { Points = pointsAwarded, Id = consumerId }, tx);

            // 5. Insert point award event
            await _db.ExecuteAsync(
                """
                INSERT INTO point_award_events
                    (consumer_id, merchant_id, purchase_amount, points_awarded, loyalty_rule_id)
                VALUES (@ConsumerId, @MerchantId, @PurchaseAmount, @PointsAwarded, @RuleId)
                """,
                new
                {
                    ConsumerId = consumerId,
                    MerchantId = merchantId,
                    PurchaseAmount = purchaseAmount,
                    PointsAwarded = pointsAwarded,
                    RuleId = rule.Id
                }, tx);

            // 6. Insert notification
            await _db.ExecuteAsync(
                """
                INSERT INTO notifications (consumer_id, category, title, body)
                VALUES (@ConsumerId, 'points_earned', @Title, @Body)
                """,
                new
                {
                    ConsumerId = consumerId,
                    Title = "Points Earned",
                    Body = $"You earned {pointsAwarded} points for a purchase of {purchaseAmount}."
                }, tx);

            await tx.CommitAsync();

            var updatedBalance = consumerBalance.Value + pointsAwarded;
            return new AwardResult(pointsAwarded, updatedBalance);
        }
        catch (Exception) when (tx.Connection is not null)
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
