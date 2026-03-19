using Dapper;
using Npgsql;
using OnePoint.Api.Models;

namespace OnePoint.Api.Services;

/// <summary>
/// Handles in-app notifications: creation, unread retrieval, and mark-as-read.
/// </summary>
public class NotificationService
{
    private readonly NpgsqlConnection _db;

    public NotificationService(NpgsqlConnection db) => _db = db;

    /// <summary>
    /// Create a notification for a consumer. Verifies the consumer exists and is active
    /// before inserting the record. For MVP, notification preferences are not checked.
    /// </summary>
    public async Task<Notification> CreateNotification(
        Guid consumerId, string category, string title, string body)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new ValidationException("Category is required.");

        if (string.IsNullOrWhiteSpace(title))
            throw new ValidationException("Title is required.");

        if (string.IsNullOrWhiteSpace(body))
            throw new ValidationException("Body is required.");

        await _db.OpenAsync();

        // Verify consumer exists and is active
        var consumerExists = await _db.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM consumers WHERE id = @Id AND is_active = true)",
            new { Id = consumerId });

        if (!consumerExists)
            throw new NotFoundException("Consumer not found or inactive.");

        // Insert notification with is_read = false (DB default)
        var notification = await _db.QuerySingleAsync<Notification>(
            """
            INSERT INTO notifications (consumer_id, category, title, body)
            VALUES (@ConsumerId, @Category, @Title, @Body)
            RETURNING id AS Id, consumer_id AS ConsumerId, category AS Category,
                      title AS Title, body AS Body, is_read AS IsRead, created_at AS CreatedAt
            """,
            new
            {
                ConsumerId = consumerId,
                Category = category,
                Title = title,
                Body = body
            });

        return notification;
    }

    /// <summary>
    /// Return all unread notifications for a consumer, ordered by most recent first.
    /// </summary>
    public async Task<List<Notification>> GetUnread(Guid consumerId)
    {
        await _db.OpenAsync();

        var notifications = await _db.QueryAsync<Notification>(
            """
            SELECT id AS Id, consumer_id AS ConsumerId, category AS Category,
                   title AS Title, body AS Body, is_read AS IsRead, created_at AS CreatedAt
            FROM notifications
            WHERE consumer_id = @ConsumerId AND is_read = false
            ORDER BY created_at DESC
            """,
            new { ConsumerId = consumerId });

        return notifications.ToList();
    }

    /// <summary>
    /// Mark a notification as read. Throws NotFoundException if the notification does not exist.
    /// </summary>
    public async Task MarkAsRead(Guid notificationId)
    {
        await _db.OpenAsync();

        var rowsAffected = await _db.ExecuteAsync(
            "UPDATE notifications SET is_read = true WHERE id = @Id",
            new { Id = notificationId });

        if (rowsAffected == 0)
            throw new NotFoundException("Notification not found.");
    }
}
