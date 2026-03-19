namespace LoyaltyApi.Models;

// Requests
public record LoginRequest(string Username, string Password);
public record RedeemRequest(int UserId, int MerchantId, int RedeemId);
public record GenerateRequest(int UserId, int MerchantId);
public record SwapRequest(int UserId, int MerchantId, int MerchantPoints);
public record NotificationRequest(int UserId, int Points);

// Responses
public record LoginResponse(int UserId, string Name, string Token);
public record PointsResponse(int UserId, int Points);
public record RedeemResponse(int UserId, int PointsUsed, int RemainingPoints, string RedeemOptionName);
public record GenerateResponse(int UserId, int PointsAvailable);
public record SwapResponse(int UserId, int MerchantPointsSwapped, int LoyaltyPointsReceived, int TotalPoints);
public record TransactionResponse(int Id, string Type, int Points, int MerchantId, DateTime CreatedAt, string? Description);
public record NotificationResponse(bool Success, string Message);
