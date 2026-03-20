using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles merchant and merchant-user management: creation, deactivation,
/// and listing operations.
/// </summary>
public class MerchantService
{
    private readonly NpgsqlConnection _db;

    public MerchantService(NpgsqlConnection db)
    {
        string _connectionString = "Host=aws-1-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Pooling=true;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
        _db = new NpgsqlConnection(_connectionString);
    }

    /// <summary>
    /// Create a new merchant. Validates that business_name is not empty.
    /// </summary>
    public async Task<Merchant> CreateMerchant(MerchantInput input)
    {
        if (string.IsNullOrWhiteSpace(input.BusinessName))
            throw new ValidationException("Business name is required.");

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var merchant = await _db.QuerySingleAsync<Merchant>(
            """
            INSERT INTO merchants (business_name, business_registration, settlement_balance, is_active)
            VALUES (@BusinessName, @BusinessRegistration, 0, true)
            RETURNING id AS Id, business_name AS BusinessName,
                      business_registration AS BusinessRegistration,
                      settlement_balance AS SettlementBalance,
                      is_active AS IsActive, created_at AS CreatedAt
            """,
            new { input.BusinessName, input.BusinessRegistration });

        return merchant;
    }

    /// <summary>
    /// Update a merchant's business details. Validates that business_name is not empty.
    /// </summary>
    public async Task<Merchant> UpdateMerchant(Guid merchantId, MerchantInput input)
    {
        if (string.IsNullOrWhiteSpace(input.BusinessName))
            throw new ValidationException("Business name is required.");

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var merchant = await _db.QuerySingleOrDefaultAsync<Merchant>(
            """
            UPDATE merchants
            SET business_name = @BusinessName, business_registration = @BusinessRegistration
            WHERE id = @Id AND is_active = true
            RETURNING id AS Id, business_name AS BusinessName,
                      business_registration AS BusinessRegistration,
                      settlement_balance AS SettlementBalance,
                      is_active AS IsActive, created_at AS CreatedAt
            """,
            new { Id = merchantId, input.BusinessName, input.BusinessRegistration });

        if (merchant is null)
            throw new NotFoundException("Merchant not found or inactive.");

        return merchant;
    }

    /// <summary>
    /// Deactivate a merchant and all associated merchant_users in a single transaction.
    /// Throws NotFoundException if the merchant does not exist.
    /// </summary>
    public async Task DeactivateMerchant(Guid merchantId)
    {
        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();
        await using var tx = await _db.BeginTransactionAsync();

        try
        {
            var exists = await _db.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = @Id)",
                new { Id = merchantId }, tx);

            if (!exists)
                throw new NotFoundException("Merchant not found.");

            // Deactivate the merchant
            await _db.ExecuteAsync(
                "UPDATE merchants SET is_active = false WHERE id = @Id",
                new { Id = merchantId }, tx);

            // Deactivate all associated merchant users
            await _db.ExecuteAsync(
                "UPDATE merchant_users SET is_active = false WHERE merchant_id = @MerchantId",
                new { MerchantId = merchantId }, tx);

            await tx.CommitAsync();
        }
        catch (Exception) when (tx.Connection is not null)
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Create a merchant user associated with a merchant.
    /// Verifies the merchant exists and is active, and validates email is not empty.
    /// </summary>
    public async Task<MerchantUser> CreateMerchantUser(Guid merchantId, MerchantUserInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Email))
            throw new ValidationException("Email is required.");

        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var merchantActive = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = @Id AND is_active = true)",
            new { Id = merchantId });

        if (!merchantActive)
            throw new NotFoundException("Merchant not found or inactive.");

        var merchantUser = await _db.QuerySingleAsync<MerchantUser>(
            """
            INSERT INTO merchant_users (merchant_id, auth_user_id, email, role, is_active)
            VALUES (@MerchantId, @AuthUserId, @Email, @Role, true)
            RETURNING id AS Id, merchant_id AS MerchantId, auth_user_id AS AuthUserId,
                      email AS Email, role AS Role, is_active AS IsActive,
                      created_at AS CreatedAt
            """,
            new
            {
                MerchantId = merchantId,
                input.AuthUserId,
                input.Email,
                input.Role
            });

        return merchantUser;
    }

    /// <summary>
    /// Return all merchant_users for a given merchant.
    /// Throws NotFoundException if the merchant does not exist.
    /// </summary>
    public async Task<List<MerchantUser>> GetMerchantUsers(Guid merchantId)
    {
        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var exists = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = @Id)",
            new { Id = merchantId });

        if (!exists)
            throw new NotFoundException("Merchant not found.");

        var users = await _db.QueryAsync<MerchantUser>(
            """
            SELECT id AS Id, merchant_id AS MerchantId, auth_user_id AS AuthUserId,
                   email AS Email, role AS Role, is_active AS IsActive,
                   created_at AS CreatedAt
            FROM merchant_users
            WHERE merchant_id = @MerchantId
            """,
            new { MerchantId = merchantId });

        return users.ToList();
    }

    /// <summary>
    /// Return all merchants.
    /// </summary>
    public async Task<List<Merchant>> GetMerchants()
    {
        if (_db.State != System.Data.ConnectionState.Open)
            await _db.OpenAsync();

        var merchants = await _db.QueryAsync<Merchant>(
            """
            SELECT id AS Id, business_name AS BusinessName,
                   business_registration AS BusinessRegistration,
                   settlement_balance AS SettlementBalance,
                   is_active AS IsActive, created_at AS CreatedAt
            FROM merchants
            """);

        return merchants.ToList();
    }
}
