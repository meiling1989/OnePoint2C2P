using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Provides dashboard-specific queries: overview stats, merchant lookups for auth.
/// </summary>
public class DashboardService
{
    private readonly NpgsqlConnection _db;

    public DashboardService(NpgsqlConnection db) => _db = db;

    /// <summary>
    /// Get overview statistics for a period, optionally scoped to a merchant.
    /// </summary>
    public async Task<DashboardOverview> GetOverview(Guid? merchantId, string period)
    {
        var fromDate = period?.ToLowerInvariant() switch
        {
            "daily" => DateTimeOffset.UtcNow.Date,
            "weekly" => DateTimeOffset.UtcNow.AddDays(-7),
            "monthly" => DateTimeOffset.UtcNow.AddDays(-30),
            _ => (DateTimeOffset?)null
        };

        var where = "WHERE 1=1";
        var parameters = new DynamicParameters();

        if (merchantId.HasValue)
        {
            where += " AND merchant_id = @MerchantId";
            parameters.Add("MerchantId", merchantId.Value);
        }
        if (fromDate.HasValue)
        {
            where += " AND created_at >= @FromDate";
            parameters.Add("FromDate", fromDate.Value);
        }

        await _db.OpenAsync();

        var sql = $"""
            SELECT
                COUNT(*)::int AS TransactionCount,
                COALESCE(SUM(points_redeemed), 0) AS TotalPointsRedeemed,
                COALESCE(SUM(monetary_value), 0) AS TotalMonetaryValue
            FROM redemption_transactions
            {where}
            """;

        var result = await _db.QuerySingleAsync<DashboardOverview>(sql, parameters);
        return result;
    }

    /// <summary>
    /// Look up the merchant_user record by Supabase auth user ID to determine role and merchant.
    /// </summary>
    public async Task<MerchantUser?> GetMerchantUserByAuthId(Guid authUserId)
    {
        await _db.OpenAsync();

        return await _db.QuerySingleOrDefaultAsync<MerchantUser>(
            """
            SELECT id AS Id, merchant_id AS MerchantId, auth_user_id AS AuthUserId,
                   email AS Email, role AS Role, is_active AS IsActive,
                   created_at AS CreatedAt
            FROM merchant_users
            WHERE auth_user_id = @AuthUserId AND is_active = true
            """,
            new { AuthUserId = authUserId });
    }
}

/// <summary>
/// Dashboard overview statistics DTO.
/// </summary>
public record DashboardOverview(
    int TransactionCount,
    decimal TotalPointsRedeemed,
    decimal TotalMonetaryValue);
