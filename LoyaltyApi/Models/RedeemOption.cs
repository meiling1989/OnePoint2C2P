namespace LoyaltyApi.Models;

public class RedeemOption
{
    public int Id { get; set; }
    public int MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PointsCost { get; set; }
}
