using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles partner program linking: link/unlink partner programs for consumers,
/// and retrieve all linked partners for a consumer.
/// </summary>
public class PartnerLinkService
{
    private readonly NpgsqlConnection _db;

    public PartnerLinkService(NpgsqlConnection db)
    {
        string _connectionString = "Host=aws-1-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Pooling=true;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
        _db = new NpgsqlConnection(_connectionString);
    }

    /// <summary>
    /// Link a partner program to a consumer account.
    /// Verifies consumer and program exist and are active, checks for duplicate links,
    /// and inserts a partner_links record with cached_balance = 0 (mock balance for MVP).
    /// </summary>
    public async Task<PartnerLink> LinkPartner(Guid consumerId, string programId)
    {
        await _db.OpenAsync();

        // 1. Verify consumer exists and is active
        var consumerExists = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM consumers WHERE id = @Id AND is_active = true)",
            new { Id = consumerId });

        if (!consumerExists)
            throw new NotFoundException("Consumer not found or inactive.");

        // 2. Verify partner program exists and is active
        var programExists = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM partner_programs WHERE id = @Id AND is_active = true)",
            new { Id = programId });

        if (!programExists)
            throw new NotFoundException($"Partner program '{programId}' not found or inactive.");

        // 3. Check if link already exists (DB has UNIQUE constraint uq_consumer_program)
        var alreadyLinked = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM partner_links WHERE consumer_id = @ConsumerId AND program_id = @ProgramId)",
            new { ConsumerId = consumerId, ProgramId = programId });

        if (alreadyLinked)
            throw new ValidationException($"Consumer is already linked to program '{programId}'.");

        // 4. Insert partner_links record with cached_balance = 0 (mock for MVP)
        var link = await _db.QuerySingleAsync<PartnerLink>(
            """
            INSERT INTO partner_links (consumer_id, program_id, cached_balance)
            VALUES (@ConsumerId, @ProgramId, 0)
            RETURNING id AS Id, consumer_id AS ConsumerId, program_id AS ProgramId,
                      cached_balance AS CachedBalance, linked_at AS LinkedAt
            """,
            new { ConsumerId = consumerId, ProgramId = programId });

        return link;
    }

    /// <summary>
    /// Unlink a partner program from a consumer account.
    /// Deletes the partner_link record. Throws NotFoundException if the link doesn't exist.
    /// </summary>
    public async Task UnlinkPartner(Guid consumerId, string programId)
    {
        await _db.OpenAsync();

        var rowsAffected = await _db.ExecuteAsync(
            "DELETE FROM partner_links WHERE consumer_id = @ConsumerId AND program_id = @ProgramId",
            new { ConsumerId = consumerId, ProgramId = programId });

        if (rowsAffected == 0)
            throw new NotFoundException($"No link found for consumer and program '{programId}'.");
    }

    /// <summary>
    /// Get all linked partner programs for a consumer.
    /// Returns an empty list if no links are found.
    /// </summary>
    public async Task<List<PartnerLink>> GetLinkedPartners(Guid consumerId)
    {
        await _db.OpenAsync();

        var links = await _db.QueryAsync<PartnerLink>(
            """
            SELECT id AS Id, consumer_id AS ConsumerId, program_id AS ProgramId,
                   cached_balance AS CachedBalance, linked_at AS LinkedAt
            FROM partner_links
            WHERE consumer_id = @ConsumerId
            ORDER BY linked_at DESC
            """,
            new { ConsumerId = consumerId });

        return links.ToList();
    }
}
