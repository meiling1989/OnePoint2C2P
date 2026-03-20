using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles promotion management: creation with validation, active promotion
/// listing with optional filters, and single promotion retrieval.
/// </summary>
public class PromotionService
{
    private readonly NpgsqlConnection _db;

    public PromotionService(NpgsqlConnection db)
    {
        string _connectionString = "Host=aws-1-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Pooling=true;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
        _db = new NpgsqlConnection(_connectionString);
    }

    /// <summary>
    /// Create a new promotion for a merchant after validating inputs.
    /// </summary>
    public async Task<Promotion> CreatePromotion(Guid merchantId, PromotionInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Description))
            throw new ValidationException("invalid-promotion");

        if (input.ValidFrom >= input.ValidUntil)
            throw new ValidationException("invalid-promotion");

        if (input.RequiredPoints <= 0)
            throw new ValidationException("invalid-promotion");

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        // Verify merchant exists and is active
        var merchantExists = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = @Id AND is_active = true)",
            new { Id = merchantId });

        if (!merchantExists)
            throw new NotFoundException("Merchant not found or inactive.");

        // Insert promotion record
        var promotion = await _db.QuerySingleAsync<Promotion>(
            """
            INSERT INTO promotions
                (merchant_id, description, category, required_points, terms_conditions, valid_from, valid_until, is_active)
            VALUES
                (@MerchantId, @Description, @Category, @RequiredPoints, @TermsConditions, @ValidFrom, @ValidUntil, true)
            RETURNING
                id AS Id, merchant_id AS MerchantId, description AS Description,
                category AS Category, required_points AS RequiredPoints,
                terms_conditions AS TermsConditions, valid_from AS ValidFrom,
                valid_until AS ValidUntil, is_active AS IsActive, created_at AS CreatedAt
            """,
            new
            {
                MerchantId = merchantId,
                input.Description,
                input.Category,
                input.RequiredPoints,
                input.TermsConditions,
                input.ValidFrom,
                input.ValidUntil
            });

        return promotion;
    }

    /// <summary>
    /// Return active promotions (is_active = true AND valid_until > now),
    /// with optional merchant and category filters.
    /// </summary>
    public async Task<List<Promotion>> GetActivePromotions(PromotionFilter? filter)
    {
        var where = "WHERE p.is_active = true AND p.valid_until > now()";
        var parameters = new DynamicParameters();

        if (filter?.MerchantId.HasValue == true)
        {
            where += " AND p.merchant_id = @MerchantId";
            parameters.Add("MerchantId", filter.MerchantId.Value);
        }

        if (!string.IsNullOrEmpty(filter?.Category))
        {
            where += " AND p.category = @Category";
            parameters.Add("Category", filter.Category);
        }

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var sql = $"""
            SELECT id AS Id, merchant_id AS MerchantId, description AS Description,
                   category AS Category, required_points AS RequiredPoints,
                   terms_conditions AS TermsConditions, valid_from AS ValidFrom,
                   valid_until AS ValidUntil, is_active AS IsActive, created_at AS CreatedAt
            FROM promotions p
            {where}
            ORDER BY p.valid_until ASC
            """;

        var items = (await _db.QueryAsync<Promotion>(sql, parameters)).ToList();
        return items;
    }

    /// <summary>
    /// Retrieve a single promotion by ID.
    /// </summary>
    public async Task<Promotion> GetPromotion(Guid promotionId)
    {
        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var promotion = await _db.QuerySingleOrDefaultAsync<Promotion>(
            """
            SELECT id AS Id, merchant_id AS MerchantId, description AS Description,
                   category AS Category, required_points AS RequiredPoints,
                   terms_conditions AS TermsConditions, valid_from AS ValidFrom,
                   valid_until AS ValidUntil, is_active AS IsActive, created_at AS CreatedAt
            FROM promotions WHERE id = @Id
            """,
            new { Id = promotionId });

        if (promotion is null)
            throw new NotFoundException("Promotion not found.");

        return promotion;
    }
}
