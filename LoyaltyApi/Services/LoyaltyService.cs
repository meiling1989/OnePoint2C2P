using Microsoft.EntityFrameworkCore;
using LoyaltyApi.Data;
using LoyaltyApi.Models;

namespace LoyaltyApi.Services;

public class LoyaltyService : ILoyaltyService
{
    private readonly LoyaltyDbContext _db;
    private readonly IEmailService _emailService;

    public LoyaltyService(LoyaltyDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Username == request.Username);

        if (customer is null || !BCrypt.Net.BCrypt.Verify(request.Password, customer.PasswordHash))
            throw new UnauthorizedAccessException("Invalid username or password.");

        // Simple token for demo — replace with JWT in production
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        return new LoginResponse(customer.Id, customer.Name, token);
    }

    public async Task<RedeemResponse> RedeemAsync(RedeemRequest request)
    {
        var customer = await _db.Customers.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("Customer not found.");

        var redeemOption = await _db.RedeemOptions
            .FirstOrDefaultAsync(r => r.Id == request.RedeemId && r.MerchantId == request.MerchantId)
            ?? throw new KeyNotFoundException("Redeem option not found.");

        if (customer.Points < redeemOption.PointsCost)
            throw new InvalidOperationException("Insufficient points.");

        customer.Points -= redeemOption.PointsCost;

        _db.Transactions.Add(new Transaction
        {
            CustomerId = request.UserId,
            MerchantId = request.MerchantId,
            Type = "Redeem",
            Points = -redeemOption.PointsCost,
            Description = $"Redeemed: {redeemOption.Name}"
        });

        await _db.SaveChangesAsync();
        return new RedeemResponse(customer.Id, redeemOption.PointsCost, customer.Points, redeemOption.Name);
    }

    public async Task<GenerateResponse> GeneratePointsAsync(GenerateRequest request)
    {
        var customer = await _db.Customers.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("Customer not found.");

        var merchant = await _db.Merchants.FindAsync(request.MerchantId)
            ?? throw new KeyNotFoundException("Merchant not found.");

        // Return current available points for the customer
        return new GenerateResponse(customer.Id, customer.Points);
    }

    public async Task<SwapResponse> SwapPointsAsync(SwapRequest request)
    {
        var customer = await _db.Customers.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("Customer not found.");

        var merchant = await _db.Merchants.FindAsync(request.MerchantId)
            ?? throw new KeyNotFoundException("Merchant not found.");

        var loyaltyPoints = (int)(request.MerchantPoints * merchant.SwapRate);
        customer.Points += loyaltyPoints;

        _db.Transactions.Add(new Transaction
        {
            CustomerId = request.UserId,
            MerchantId = request.MerchantId,
            Type = "Swap",
            Points = loyaltyPoints,
            Description = $"Swapped {request.MerchantPoints} merchant points from {merchant.Name}"
        });

        await _db.SaveChangesAsync();
        return new SwapResponse(customer.Id, request.MerchantPoints, loyaltyPoints, customer.Points);
    }

    public async Task<PointsResponse> GetPointsAsync(int userId)
    {
        var customer = await _db.Customers.FindAsync(userId)
            ?? throw new KeyNotFoundException("Customer not found.");

        return new PointsResponse(customer.Id, customer.Points);
    }

    public async Task<List<TransactionResponse>> GetTransactionsAsync(int userId)
    {
        var exists = await _db.Customers.AnyAsync(c => c.Id == userId);
        if (!exists) throw new KeyNotFoundException("Customer not found.");

        return await _db.Transactions
            .Where(t => t.CustomerId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionResponse(t.Id, t.Type, t.Points, t.MerchantId, t.CreatedAt, t.Description))
            .ToListAsync();
    }

    public async Task<NotificationResponse> SendNotificationAsync(NotificationRequest request)
    {
        var customer = await _db.Customers.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("Customer not found.");

        var subject = "Loyalty Points Notification";
        var body = $"Hello {customer.Name}, you have {request.Points} loyalty points.";

        var sent = await _emailService.SendEmailAsync(customer.Email, subject, body);
        return new NotificationResponse(sent, sent ? "Notification sent." : "Failed to send notification.");
    }
}
