namespace OnePoint.Api.Models;

/// <summary>
/// Consumer account holding OnePoint balance and linked partner programs.
/// Maps to the <c>consumers</c> table.
/// </summary>
public record Consumer(
    Guid Id,
    string PhoneNumber,
    string? DisplayName,
    decimal OnepointBalance,
    string? QrCodeData,
    bool IsActive,
    DateTimeOffset CreatedAt)
{

    // Dapper may materialize timestamp columns as System.DateTime. Provide an
    // overload that accepts DateTime so materialization succeeds without
    // requiring a parameterless constructor.
    public Consumer(Guid Id, string PhoneNumber, string? DisplayName, decimal OnepointBalance, string? QrCodeData, bool IsActive, DateTime createdAt)
        : this(Id, PhoneNumber, DisplayName, OnepointBalance, QrCodeData, IsActive, new DateTimeOffset(createdAt))
    {
    }
};

/// <summary>
/// Link between a consumer and an external partner loyalty program.
/// Maps to the <c>partner_links</c> table.
/// </summary>
public record PartnerLink(
    Guid Id,
    Guid ConsumerId,
    string ProgramId,
    decimal CachedBalance,
    DateTimeOffset LinkedAt);

/// <summary>
/// External loyalty program with conversion rates to/from OnePoint.
/// Maps to the <c>partner_programs</c> table. Uses a text primary key.
/// </summary>
public record PartnerProgram(
    string Id,
    string Name,
    decimal RateToOnepoint,
    decimal RateFromOnepoint,
    bool IsActive);

/// <summary>
/// A point redemption transaction at a merchant.
/// Maps to the <c>redemption_transactions</c> table.
/// </summary>
public record RedemptionTransaction(
    Guid Id,
    string TransactionRef,
    Guid ConsumerId,
    Guid MerchantId,
    decimal PointsRedeemed,
    decimal MonetaryValue,
    string Method,
    string Status,
    DateTimeOffset CreatedAt);

/// <summary>
/// Record of points awarded to a consumer for a purchase.
/// Maps to the <c>point_award_events</c> table.
/// </summary>
public record PointAwardEvent(
    Guid Id,
    Guid ConsumerId,
    Guid MerchantId,
    decimal PurchaseAmount,
    decimal PointsAwarded,
    Guid LoyaltyRuleId,
    DateTimeOffset CreatedAt);

/// <summary>
/// A point swap between two partner programs via OnePoint intermediary.
/// Maps to the <c>swap_transactions</c> table.
/// </summary>
public record SwapTransaction(
    Guid Id,
    Guid ConsumerId,
    string SourceProgramId,
    string TargetProgramId,
    decimal SourceAmount,
    decimal OnepointIntermediate,
    decimal TargetAmount,
    string Status,
    DateTimeOffset CreatedAt);

/// <summary>
/// A merchant business that accepts OnePoint redemptions.
/// Maps to the <c>merchants</c> table.
/// </summary>
public record Merchant(
    Guid Id,
    string BusinessName,
    string? BusinessRegistration,
    decimal SettlementBalance,
    bool IsActive,
    DateTimeOffset CreatedAt)
{

    // Dapper may materialize timestamp columns as System.DateTime. Provide an
    // overload that accepts DateTime so materialization succeeds without
    // requiring a parameterless constructor.
    public Merchant(Guid Id, string BusinessName, string? BusinessRegistration, decimal SettlementBalance, bool IsActive, DateTime createdAt)
        : this(Id, BusinessName, BusinessRegistration, SettlementBalance, IsActive, new DateTimeOffset(createdAt))
    {
    }
};

/// <summary>
/// A user account associated with a merchant (dashboard access).
/// Maps to the <c>merchant_users</c> table.
/// </summary>
public record MerchantUser(
    Guid Id,
    Guid MerchantId,
    Guid AuthUserId,
    string Email,
    string Role,
    bool IsActive,
    DateTimeOffset CreatedAt);

/// <summary>
/// A rule defining how points are earned or redeemed at a merchant.
/// Maps to the <c>loyalty_rules</c> table.
/// </summary>
public record LoyaltyRule(
    Guid Id,
    Guid MerchantId,
    string RuleType,
    decimal PurchaseThreshold,
    decimal PointsValue,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

/// <summary>
/// A time-bound promotional offer from a merchant.
/// Maps to the <c>promotions</c> table.
/// </summary>
public record Promotion(
    Guid Id,
    Guid MerchantId,
    string Description,
    string? Category,
    decimal RequiredPoints,
    string? TermsConditions,
    DateTimeOffset ValidFrom,
    DateTimeOffset ValidUntil,
    bool IsActive,
    DateTimeOffset CreatedAt);

/// <summary>
/// An in-app notification for a consumer.
/// Maps to the <c>notifications</c> table.
/// </summary>
public record Notification(
    Guid Id,
    Guid ConsumerId,
    string Category,
    string Title,
    string Body,
    bool IsRead,
    DateTimeOffset CreatedAt);
