namespace OnePoint.Api.Models;

/// <summary>
/// Generic paginated result wrapper.
/// </summary>
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount);

/// <summary>
/// Result of a successful point redemption.
/// </summary>
public record RedemptionResult(
    string TransactionRef,
    string Status,
    decimal PointsRedeemed,
    decimal MonetaryValue,
    decimal UpdatedBalance);

/// <summary>
/// Result of a successful point award.
/// </summary>
public record AwardResult(
    decimal PointsAwarded,
    decimal UpdatedBalance);

/// <summary>
/// Preview of a point swap before confirmation.
/// </summary>
public record SwapPreview(
    decimal SourceAmount,
    decimal OnepointIntermediate,
    decimal TargetAmount,
    string SourceProgram,
    string TargetProgram);

/// <summary>
/// Result of a confirmed point swap.
/// </summary>
public record SwapResult(
    Guid SwapId,
    string Status,
    decimal SourceAmount,
    decimal TargetAmount);
