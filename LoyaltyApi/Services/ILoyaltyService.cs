using LoyaltyApi.Models;

namespace LoyaltyApi.Services;

public interface ILoyaltyService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<RedeemResponse> RedeemAsync(RedeemRequest request);
    Task<GenerateResponse> GeneratePointsAsync(GenerateRequest request);
    Task<SwapResponse> SwapPointsAsync(SwapRequest request);
    Task<PointsResponse> GetPointsAsync(int userId);
    Task<List<TransactionResponse>> GetTransactionsAsync(int userId);
    Task<NotificationResponse> SendNotificationAsync(NotificationRequest request);
}
