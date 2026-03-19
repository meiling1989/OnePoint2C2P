using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Manages loyalty rules for merchants: creation, updates, and retrieval
/// of earn/redeem rules that define how points are awarded.
/// </summary>
public class LoyaltyRuleService
{
    private readonly NpgsqlConnection _db;

    public LoyaltyRuleService(NpgsqlConnection db) => _db = db;

    /// <summary>
    /// Create a new loyalty rule for a merchant. Validates that purchase_threshold
    /// and points_value are positive, and that the merchant exists and is active.
    /// </summary>
    public async Task<LoyaltyRule> CreateRule(Guid merchantId, LoyaltyRuleInput input)
    {
        if (input.PurchaseThreshold <= 0)
            throw new ValidationException("Purchase threshold must be a positive number.");

        if (input.PointsValue <= 0)
            throw new ValidationException("Points value must be a positive number.");

        await _db.OpenAsync();

        var merchantActive = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = @Id AND is_active = true)",
            new { Id = merchantId });

        if (!merchantActive)
            throw new NotFoundException("Merchant not found or inactive.");

        var rule = await _db.QuerySingleAsync<LoyaltyRule>(
            """
            INSERT INTO loyalty_rules (merchant_id, rule_type, purchase_threshold, points_value, is_active)
            VALUES (@MerchantId, @RuleType, @PurchaseThreshold, @PointsValue, true)
            RETURNING id AS Id, merchant_id AS MerchantId, rule_type AS RuleType,
                      purchase_threshold AS PurchaseThreshold, points_value AS PointsValue,
                      is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
            """,
            new
            {
                MerchantId = merchantId,
                input.RuleType,
                input.PurchaseThreshold,
                input.PointsValue
            });

        return rule;
    }

    /// <summary>
    /// Update an existing loyalty rule's type, threshold, value, and updated_at timestamp.
    /// Validates positive numbers and throws NotFoundException if the rule doesn't exist.
    /// </summary>
    public async Task<LoyaltyRule> UpdateRule(Guid ruleId, LoyaltyRuleInput input)
    {
        if (input.PurchaseThreshold <= 0)
            throw new ValidationException("Purchase threshold must be a positive number.");

        if (input.PointsValue <= 0)
            throw new ValidationException("Points value must be a positive number.");

        await _db.OpenAsync();

        var rule = await _db.QuerySingleOrDefaultAsync<LoyaltyRule>(
            """
            UPDATE loyalty_rules
            SET rule_type = @RuleType,
                purchase_threshold = @PurchaseThreshold,
                points_value = @PointsValue,
                updated_at = now()
            WHERE id = @Id
            RETURNING id AS Id, merchant_id AS MerchantId, rule_type AS RuleType,
                      purchase_threshold AS PurchaseThreshold, points_value AS PointsValue,
                      is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
            """,
            new
            {
                Id = ruleId,
                input.RuleType,
                input.PurchaseThreshold,
                input.PointsValue
            });

        if (rule is null)
            throw new NotFoundException("Loyalty rule not found.");

        return rule;
    }

    /// <summary>
    /// Return the active loyalty rule for a merchant, or null if none exists.
    /// </summary>
    public async Task<LoyaltyRule?> GetActiveRule(Guid merchantId)
    {
        await _db.OpenAsync();

        var rule = await _db.QuerySingleOrDefaultAsync<LoyaltyRule>(
            """
            SELECT id AS Id, merchant_id AS MerchantId, rule_type AS RuleType,
                   purchase_threshold AS PurchaseThreshold, points_value AS PointsValue,
                   is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM loyalty_rules
            WHERE merchant_id = @MerchantId AND is_active = true
            LIMIT 1
            """,
            new { MerchantId = merchantId });

        return rule;
    }

    /// <summary>
    /// Deactivate a loyalty rule by setting is_active = false.
    /// </summary>
    public async Task DeactivateRule(Guid ruleId)
    {
        await _db.OpenAsync();

        var rows = await _db.ExecuteAsync(
            "UPDATE loyalty_rules SET is_active = false, updated_at = now() WHERE id = @Id",
            new { Id = ruleId });

        if (rows == 0)
            throw new NotFoundException("Loyalty rule not found.");
    }

    /// <summary>
    /// Return all loyalty rules for a merchant.
    /// </summary>
    public async Task<List<LoyaltyRule>> GetRules(Guid merchantId)
    {
        await _db.OpenAsync();

        var rules = await _db.QueryAsync<LoyaltyRule>(
            """
            SELECT id AS Id, merchant_id AS MerchantId, rule_type AS RuleType,
                   purchase_threshold AS PurchaseThreshold, points_value AS PointsValue,
                   is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM loyalty_rules
            WHERE merchant_id = @MerchantId
            """,
            new { MerchantId = merchantId });

        return rules.ToList();
    }
}
