namespace OnePoint.Api.Models;

/// <summary>
/// Request to register a new consumer.
/// </summary>
public record RegisterRequest(
    string PhoneNumber);

/// <summary>
/// Request to redeem points at a merchant.
/// </summary>
public record RedemptionRequest(
    Guid ConsumerId,
    Guid MerchantId,
    decimal Amount,
    string Method);

/// <summary>
/// Request to award points for a purchase.
/// </summary>
public record AwardRequest(
    Guid ConsumerId,
    Guid MerchantId,
    decimal PurchaseAmount);

/// <summary>
/// Request to swap points between partner programs.
/// </summary>
public record SwapRequest(
    Guid ConsumerId,
    string SourceProgram,
    string TargetProgram,
    decimal Amount);

/// <summary>
/// Request to link a partner program to a consumer account.
/// </summary>
public record PartnerLinkRequest(
    Guid ConsumerId,
    string ProgramId);

/// <summary>
/// Request to update a consumer's profile.
/// </summary>
public record ProfileUpdateRequest(
    string? DisplayName);

/// <summary>
/// Input for creating or updating a merchant.
/// </summary>
public record MerchantInput(
    string BusinessName,
    string? BusinessRegistration);

/// <summary>
/// Input for creating a merchant user.
/// </summary>
public record MerchantUserInput(
    Guid AuthUserId,
    string Email,
    string Role);

/// <summary>
/// Input for creating or updating a loyalty rule.
/// </summary>
public record LoyaltyRuleInput(
    string RuleType,
    decimal PurchaseThreshold,
    decimal PointsValue,
    string PaymentMethod);

/// <summary>
/// Input for creating or updating a promotion.
/// </summary>
public record PromotionInput(
    string Description,
    string? Category,
    decimal RequiredPoints,
    string? TermsConditions,
    DateTimeOffset ValidFrom,
    DateTimeOffset ValidUntil);

/// <summary>
/// Filter criteria for listing promotions.
/// </summary>
public record PromotionFilter(
    Guid? MerchantId,
    string? Category);

/// <summary>
/// Filter criteria for listing transactions.
/// </summary>
public record TransactionFilter(
    Guid? ConsumerId,
    Guid? MerchantId,
    DateTimeOffset? FromDate,
    DateTimeOffset? ToDate,
    string? Status,
    decimal? MinAmount);

/// <summary>
/// Request to create a loyalty rule (includes merchantId in body).
/// </summary>
public record LoyaltyRuleCreateRequest(
    Guid MerchantId,
    string RuleType,
    decimal PurchaseThreshold,
    decimal PointsValue,
    string PaymentMethod);

/// <summary>
/// Request to create a promotion (includes merchantId in body).
/// </summary>
public record PromotionCreateRequest(
    Guid MerchantId,
    string Description,
    string? Category,
    decimal RequiredPoints,
    string? TermsConditions,
    DateTimeOffset ValidFrom,
    DateTimeOffset ValidUntil);
