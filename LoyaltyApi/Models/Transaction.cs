namespace LoyaltyApi.Models;

public class Transaction
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int MerchantId { get; set; }
    public string Type { get; set; } = string.Empty; // "Earn", "Redeem", "Swap"
    public int Points { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Description { get; set; }
}
