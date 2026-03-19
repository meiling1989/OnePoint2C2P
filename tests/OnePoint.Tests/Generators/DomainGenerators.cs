using FsCheck;
using FsCheck.Fluent;
using OnePoint.Api.Models;

namespace OnePoint.Tests.Generators;

/// <summary>
/// FsCheck Arbitrary instances for domain types used in property-based tests.
/// Register via Config.WithArbitrary(new[] { typeof(DomainGenerators) }).
/// </summary>
public class DomainGenerators
{
    /// <summary>
    /// Generates a Consumer with a random 10-digit phone number, display name,
    /// positive balance, QR code data, and active flag.
    /// </summary>
    public static Arbitrary<Consumer> ConsumerArb()
    {
        var gen =
            from id in Gen.Fresh(() => Guid.NewGuid())
            from phone in GenPhoneNumber()
            from name in GenDisplayName()
            from balance in GenPositiveDecimal()
            from qr in GenQrCodeData()
            from active in Gen.Elements(true, false)
            from createdAt in GenRecentDate()
            select new Consumer(id, phone, name, balance, qr, active, createdAt);

        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a Merchant with a random business name, registration number,
    /// non-negative settlement balance, and active flag.
    /// </summary>
    public static Arbitrary<Merchant> MerchantArb()
    {
        var gen =
            from id in Gen.Fresh(() => Guid.NewGuid())
            from name in GenBusinessName()
            from reg in GenBusinessRegistration()
            from balance in GenNonNegativeDecimal()
            from active in Gen.Elements(true, false)
            from createdAt in GenRecentDate()
            select new Merchant(id, name, reg, balance, active, createdAt);

        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a LoyaltyRule with a random rule type ("earn"/"redeem"),
    /// positive purchase threshold, and positive points value.
    /// </summary>
    public static Arbitrary<LoyaltyRule> LoyaltyRuleArb()
    {
        var gen =
            from id in Gen.Fresh(() => Guid.NewGuid())
            from merchantId in Gen.Fresh(() => Guid.NewGuid())
            from ruleType in Gen.Elements("earn", "redeem")
            from threshold in GenPositiveDecimal()
            from points in GenPositiveDecimal()
            from active in Gen.Elements(true, false)
            from createdAt in GenRecentDate()
            from updatedAt in GenRecentDate()
            select new LoyaltyRule(id, merchantId, ruleType, threshold, points, active, createdAt, updatedAt);

        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a RedemptionRequest with random consumer/merchant GUIDs,
    /// a positive amount, and a method of "qr_code" or "user_id".
    /// </summary>
    public static Arbitrary<RedemptionRequest> RedemptionRequestArb()
    {
        var gen =
            from consumerId in Gen.Fresh(() => Guid.NewGuid())
            from merchantId in Gen.Fresh(() => Guid.NewGuid())
            from amount in GenPositiveDecimal()
            from method in Gen.Elements("qr_code", "user_id")
            select new RedemptionRequest(consumerId, merchantId, amount, method);

        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a SwapRequest with a random consumer GUID,
    /// source/target program IDs, and a positive amount.
    /// </summary>
    public static Arbitrary<SwapRequest> SwapRequestArb()
    {
        var programIds = new[] { "lazada", "central", "the1", "grab", "shopee" };

        var gen =
            from consumerId in Gen.Fresh(() => Guid.NewGuid())
            from source in Gen.Elements(programIds)
            from target in Gen.Elements(programIds).Where(t => t != source)
            from amount in GenPositiveDecimal()
            select new SwapRequest(consumerId, source, target, amount);

        return Arb.From(gen);
    }

    /// <summary>
    /// Generates a Promotion with a random description, category,
    /// positive required points, and valid date range (valid_from &lt; valid_until).
    /// </summary>
    public static Arbitrary<Promotion> PromotionArb()
    {
        var categories = new[] { "food", "travel", "shopping", "entertainment", "health" };

        var gen =
            from id in Gen.Fresh(() => Guid.NewGuid())
            from merchantId in Gen.Fresh(() => Guid.NewGuid())
            from desc in GenDescription()
            from category in Gen.Elements(categories)
            from requiredPoints in GenPositiveDecimal()
            from terms in GenTerms()
            from validFrom in GenRecentDate()
            from daysValid in Gen.Choose(1, 365)
            from active in Gen.Elements(true, false)
            from createdAt in GenRecentDate()
            let validUntil = validFrom.AddDays(daysValid)
            select new Promotion(id, merchantId, desc, category, requiredPoints, terms,
                validFrom, validUntil, active, createdAt);

        return Arb.From(gen);
    }

    // ── Helper generators ──────────────────────────────────────────

    /// <summary>Generates a 10-digit phone number string.</summary>
    private static Gen<string> GenPhoneNumber()
    {
        return Gen.Choose(100_000_000, 999_999_999)
            .Select(n => "0" + n.ToString());
    }

    /// <summary>Generates a random display name.</summary>
    private static Gen<string> GenDisplayName()
    {
        var firstNames = new[] { "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank" };
        var lastNames = new[] { "Smith", "Jones", "Lee", "Kim", "Chen", "Garcia", "Patel", "Brown" };

        return from first in Gen.Elements(firstNames)
               from last in Gen.Elements(lastNames)
               select $"{first} {last}";
    }

    /// <summary>Generates a positive decimal (0.01 to 100,000).</summary>
    private static Gen<decimal> GenPositiveDecimal()
    {
        return Gen.Choose(1, 10_000_000)
            .Select(n => n / 100m);
    }

    /// <summary>Generates a non-negative decimal (0 to 100,000).</summary>
    private static Gen<decimal> GenNonNegativeDecimal()
    {
        return Gen.Choose(0, 10_000_000)
            .Select(n => n / 100m);
    }

    /// <summary>Generates QR code data as a GUID-based string.</summary>
    private static Gen<string> GenQrCodeData()
    {
        return Gen.Fresh(() => $"QR-{Guid.NewGuid():N}");
    }

    /// <summary>Generates a random business name.</summary>
    private static Gen<string> GenBusinessName()
    {
        var prefixes = new[] { "Thai", "Bangkok", "Central", "Golden", "Royal", "Star", "Prime", "Metro" };
        var suffixes = new[] { "Foods", "Mart", "Shop", "Store", "Market", "Trading", "Corp", "Group" };

        return from prefix in Gen.Elements(prefixes)
               from suffix in Gen.Elements(suffixes)
               select $"{prefix} {suffix}";
    }

    /// <summary>Generates a business registration number.</summary>
    private static Gen<string> GenBusinessRegistration()
    {
        return Gen.Choose(1_000_000, 9_999_999)
            .Select(n => $"REG-{n}");
    }

    /// <summary>Generates a recent DateTimeOffset within the past year.</summary>
    private static Gen<DateTimeOffset> GenRecentDate()
    {
        return Gen.Choose(0, 365)
            .Select(daysAgo => DateTimeOffset.UtcNow.AddDays(-daysAgo));
    }

    /// <summary>Generates a promotion description.</summary>
    private static Gen<string> GenDescription()
    {
        var templates = new[]
        {
            "Get {0}% off on all items",
            "Earn {0}x points this weekend",
            "Spend {0} points and get a free gift",
            "Double points on purchases over {0} baht",
            "Special {0}% cashback promotion"
        };

        return from template in Gen.Elements(templates)
               from value in Gen.Choose(5, 50)
               select string.Format(template, value);
    }

    /// <summary>Generates optional terms and conditions text.</summary>
    private static Gen<string?> GenTerms()
    {
        return Gen.Frequency(
            (3, Gen.Constant<string?>("Terms and conditions apply. See store for details.")),
            (1, Gen.Constant<string?>(null)));
    }
}
