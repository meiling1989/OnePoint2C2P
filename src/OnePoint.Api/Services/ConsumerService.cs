using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles consumer account operations: registration, profile retrieval,
/// profile updates, and account deactivation.
/// </summary>
public class ConsumerService
{
    private readonly NpgsqlConnection _db;

    public ConsumerService(NpgsqlConnection db)
    {
        string _connectionString = "Host=aws-1-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mgsoawteaksivsakobny;Password=HTS84dzy0fa4utGF;Pooling=true;SSL Mode=Require;Trust Server Certificate=true;Timeout=15;Command Timeout=30";
        _db = new NpgsqlConnection(_connectionString);
    }

    /// <summary>
    /// Register a new consumer: verify phone number is unique, generate User_ID and QR code data,
    /// insert consumer record with zero balance. OTP verification is mocked for MVP.
    /// </summary>
    public async Task<Consumer> Register(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new ValidationException("Phone number is required.");

        await _db.OpenAsync();

        // Check if phone number already exists
        var exists = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM consumers WHERE phone_number = @Phone)",
            new { Phone = phoneNumber });

        if (exists)
            throw new ValidationException("already-registered");

        // Generate unique User_ID and QR code data
        var userId = Guid.NewGuid();
        var qrCodeData = $"ONEPOINT:{userId}";

        // Insert consumer record
        var consumer = await _db.QuerySingleAsync<Consumer>(
            """
            INSERT INTO consumers (id, phone_number, onepoint_balance, qr_code_data, is_active)
            VALUES (@Id, @Phone, 0, @QrCode, true)
            RETURNING id AS Id, phone_number AS PhoneNumber, display_name AS DisplayName,
                      onepoint_balance AS OnepointBalance, qr_code_data AS QrCodeData,
                      is_active AS IsActive, created_at AS CreatedAt
            """,
            new { Id = userId, Phone = phoneNumber, QrCode = qrCodeData });

        return consumer;
    }

    /// <summary>
    /// Retrieve a consumer by ID. Throws NotFoundException if not found or inactive.
    /// </summary>
    public async Task<Consumer> GetConsumer(Guid consumerId)
    {
        await _db.OpenAsync();

        var consumer = await _db.QuerySingleOrDefaultAsync<Consumer>(
            """
            SELECT id AS Id, phone_number AS PhoneNumber, display_name AS DisplayName,
                   onepoint_balance AS OnepointBalance, qr_code_data AS QrCodeData,
                   is_active AS IsActive, created_at AS CreatedAt
            FROM consumers WHERE id = @Id AND is_active = true
            """,
            new { Id = consumerId });

        if (consumer is null)
            throw new NotFoundException("Consumer not found or inactive.");

        return consumer;
    }

    /// <summary>
    /// Update a consumer's profile (display_name). Validates input and returns the updated record.
    /// </summary>
    public async Task<Consumer> UpdateProfile(Guid consumerId, ProfileUpdateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            throw new ValidationException("Display name cannot be empty.");

        await _db.OpenAsync();

        var rowsAffected = await _db.ExecuteAsync(
            """
            UPDATE consumers SET display_name = @DisplayName
            WHERE id = @Id AND is_active = true
            """,
            new { DisplayName = request.DisplayName, Id = consumerId });

        if (rowsAffected == 0)
            throw new NotFoundException("Consumer not found or inactive.");

        return await GetConsumer(consumerId);
    }

    /// <summary>
    /// Deactivate a consumer account: set is_active = false.
    /// </summary>
    public async Task DeactivateAccount(Guid consumerId)
    {
        await _db.OpenAsync();

        var rowsAffected = await _db.ExecuteAsync(
            "UPDATE consumers SET is_active = false WHERE id = @Id AND is_active = true",
            new { Id = consumerId });

        if (rowsAffected == 0)
            throw new NotFoundException("Consumer not found or already deactivated.");
    }
}
