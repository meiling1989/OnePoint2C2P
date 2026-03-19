namespace LoyaltyApi.Models;

public class Merchant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal SwapRate { get; set; } = 1.0m; // merchant points to loyalty points ratio
}
