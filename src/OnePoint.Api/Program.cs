using Npgsql;
using OnePoint.Api.Models;
using OnePoint.Api.Services;
using Supabase;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
var supabaseUrl = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url is not configured.");
var supabaseKey = builder.Configuration["Supabase:Key"]
    ?? throw new InvalidOperationException("Supabase:Key is not configured.");
var supabaseConnectionString = builder.Configuration.GetConnectionString("Supabase")
    ?? throw new InvalidOperationException("ConnectionStrings:Supabase is not configured.");

var url = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url is not configured.");
var key = builder.Configuration["Supabase:Key"]
    ?? throw new InvalidOperationException("Supabase:Key is not configured.");
var opt = new Supabase.SupabaseOptions
{
    AutoRefreshToken = true,
    AutoConnectRealtime = true,
};

// ---------------------------------------------------------------------------
// Supabase Client (DI)
// ---------------------------------------------------------------------------
builder.Services.AddSingleton(provider =>
{
    var options = new SupabaseOptions { AutoRefreshToken = false };
    var client = new Supabase.Client(url, key, opt);
    client.InitializeAsync().GetAwaiter().GetResult();
    return client;
});

// ---------------------------------------------------------------------------
// Npgsql Connection Factory (for Dapper queries)
// ---------------------------------------------------------------------------
builder.Services.AddScoped<NpgsqlConnection>(_ =>
    new NpgsqlConnection(supabaseConnectionString));



// ---------------------------------------------------------------------------
// Application Services
// ---------------------------------------------------------------------------
builder.Services.AddScoped<RedemptionService>();
builder.Services.AddScoped<PointAwardService>();
builder.Services.AddScoped<ConsumerService>();
builder.Services.AddScoped<MerchantService>();
builder.Services.AddScoped<LoyaltyRuleService>();
builder.Services.AddScoped<PromotionService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<SwapService>();
builder.Services.AddScoped<PartnerLinkService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<DashboardAuthState>();

// ---------------------------------------------------------------------------
// Blazor Server
// ---------------------------------------------------------------------------
var supabase = new Client(builder.Configuration["Supabase:Url"], builder.Configuration["Supabase:Key"]);

// Initialize synchronously at startup so injected singleton is ready in components.
supabase.InitializeAsync().GetAwaiter().GetResult();

builder.Services.AddSingleton(supabase);

// existing Blazor Server registrations...
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// ---------------------------------------------------------------------------
// Build App
// ---------------------------------------------------------------------------
var app = builder.Build();

// ---------------------------------------------------------------------------
// Global Error Handling Middleware
// ---------------------------------------------------------------------------
app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (InsufficientBalanceException ex)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse(
            new ErrorDetail("insufficient-balance", ex.Message, new { available = ex.AvailableBalance })));
    }
    catch (NoRuleConfiguredException ex)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse(
            new ErrorDetail("no-rule-configured", ex.Message)));
    }
    catch (ValidationException ex)
    {
        var code = ex.Message switch
        {
            "already-registered" => "already-registered",
            "invalid-promotion" => "invalid-promotion",
            _ => "validation-error"
        };
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse(
            new ErrorDetail(code, ex.Message)));
    }
    catch (NotFoundException ex)
    {
        context.Response.StatusCode = 404;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse(
            new ErrorDetail("not-found", ex.Message)));
    }
    catch (Exception ex) when (ex is not OperationCanceledException)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ErrorResponse(
            new ErrorDetail("internal-error", "An unexpected error occurred.")));
    }
});

// ---------------------------------------------------------------------------
// Middleware Pipeline
// ---------------------------------------------------------------------------
app.UseAntiforgery();

// ---------------------------------------------------------------------------
// Blazor Server — static files and component rendering
// ---------------------------------------------------------------------------
app.MapStaticAssets();
app.MapRazorComponents<OnePoint.Api.Components.App>()
    .AddInteractiveServerRenderMode();

// ---------------------------------------------------------------------------
// Health-check (anonymous)
// ---------------------------------------------------------------------------
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// ---------------------------------------------------------------------------
// API Route Groups with Authorization Policies
// ---------------------------------------------------------------------------
var api = app.MapGroup("/api");

var authApi = api.MapGroup("/auth");
var consumerApi = api.MapGroup("");
var merchantApi = api.MapGroup("");
var adminApi = api.MapGroup("");

// ===================================================================
// Auth Endpoints (Anonymous — no auth required)
// ===================================================================

// POST /api/auth/register — Req 17
authApi.MapPost("/register", async (RegisterRequest req, ConsumerService svc) =>
{
    var consumer = await svc.Register(req.PhoneNumber);
    return Results.Created($"/api/balance/{consumer.Id}", consumer);
});

// POST /api/auth/login — Req 17 (Supabase Auth handles actual login; this is a placeholder)
authApi.MapPost("/login", () =>
    Results.Ok(new { message = "Use Supabase Auth directly for login. This endpoint is a placeholder." }));

// DELETE /api/auth/account — Req 17
api.MapDelete("/auth/account", async (HttpContext ctx, ConsumerService svc) =>
{
    var userId = GetUserId(ctx);
    await svc.DeactivateAccount(userId);
    return Results.Ok(new { status = "deactivated" });
});

// PUT /api/auth/profile — Req 17
api.MapPut("/auth/profile", async (HttpContext ctx, ProfileUpdateRequest req, ConsumerService svc) =>
{
    var userId = GetUserId(ctx);
    var updated = await svc.UpdateProfile(userId, req);
    return Results.Ok(updated);
});

// ===================================================================
// Balance Endpoint (Consumer)
// ===================================================================

// GET /api/balance/{userId} — Req 4, 16
consumerApi.MapGet("/balance/{userId:guid}", async (Guid userId, ConsumerService consumerSvc, PartnerLinkService partnerSvc) =>
{
    var consumer = await consumerSvc.GetConsumer(userId);
    var partners = await partnerSvc.GetLinkedPartners(userId);
    return Results.Ok(new
    {
        consumer.Id,
        consumer.OnepointBalance,
        PartnerBalances = partners.Select(p => new { p.ProgramId, p.CachedBalance })
    });
});

// ===================================================================
// Redemption Endpoints (MerchantUser — POS terminal operations)
// ===================================================================

// POST /api/redemptions — Req 15
merchantApi.MapPost("/redemptions", async (RedemptionRequest req, RedemptionService svc) =>
{
    var result = await svc.ProcessRedemption(req.ConsumerId, req.MerchantId, req.Amount, req.Method);
    return Results.Ok(result);
});

// GET /api/redemptions — Req 5, 12
api.MapGet("/redemptions", async (
    Guid? consumerId, Guid? merchantId,
    DateTimeOffset? fromDate, DateTimeOffset? toDate,
    string? status, decimal? minAmount,
    int? page, int? pageSize,
    string? sortBy, string? sortDir,
    RedemptionService svc) =>
{
    var filter = new TransactionFilter(consumerId, merchantId, fromDate, toDate, status, minAmount);
    var result = await svc.GetTransactions(filter, page ?? 1, pageSize ?? 20, sortBy ?? "date", sortDir ?? "desc");
    return Results.Ok(result);
});

// POST /api/redemptions/{transactionRef}/reverse — Req 15.8
merchantApi.MapPost("/redemptions/{transactionRef}/reverse", async (string transactionRef, RedemptionService svc) =>
{
    await svc.ReverseRedemption(transactionRef);
    return Results.Ok(new { status = "reversed" });
});

// ===================================================================
// Point Award Endpoint (MerchantUser)
// ===================================================================

// POST /api/points/award — Req 16
merchantApi.MapPost("/points/award", async (AwardRequest req, PointAwardService svc) =>
{
    var result = await svc.AwardPoints(req.ConsumerId, req.MerchantId, req.PurchaseAmount);
    return Results.Ok(result);
});

// ===================================================================
// Swap Endpoints (Consumer)
// ===================================================================

// POST /api/swaps — Req 18
consumerApi.MapPost("/swaps", async (SwapRequest req, SwapService svc) =>
{
    var preview = await svc.CalculateSwap(req.SourceProgram, req.TargetProgram, req.Amount);
    var result = await svc.ExecuteSwap(req.ConsumerId, preview);
    return Results.Ok(result);
});

// GET /api/swaps/rates — Req 18
consumerApi.MapGet("/swaps/rates", async (string source, string target, decimal amount, SwapService svc) =>
{
    var preview = await svc.CalculateSwap(source, target, amount);
    return Results.Ok(preview);
});

// ===================================================================
// Partner Link Endpoints (Consumer)
// ===================================================================

// POST /api/partners/link — Req 18
consumerApi.MapPost("/partners/link", async (PartnerLinkRequest req, PartnerLinkService svc) =>
{
    var link = await svc.LinkPartner(req.ConsumerId, req.ProgramId);
    return Results.Created($"/api/partners", link);
});

// DELETE /api/partners/{programId} — Req 18
consumerApi.MapDelete("/partners/{programId}", async (string programId, HttpContext ctx, PartnerLinkService svc) =>
{
    var userId = GetUserId(ctx);
    await svc.UnlinkPartner(userId, programId);
    return Results.Ok(new { status = "unlinked" });
});

// GET /api/partners — Req 7
consumerApi.MapGet("/partners", async (HttpContext ctx, PartnerLinkService svc) =>
{
    var userId = GetUserId(ctx);
    var links = await svc.GetLinkedPartners(userId);
    return Results.Ok(links);
});

// ===================================================================
// Merchant Endpoints (Admin)
// ===================================================================

// POST /api/merchants — Req 20
adminApi.MapPost("/merchants", async (MerchantInput input, MerchantService svc) =>
{
    var merchant = await svc.CreateMerchant(input);
    return Results.Created($"/api/merchants/{merchant.Id}", merchant);
});

// GET /api/merchants — Req 20
adminApi.MapGet("/merchants", async (MerchantService svc) =>
{
    var merchants = await svc.GetMerchants();
    return Results.Ok(merchants);
});

// PUT /api/merchants/{id} — Req 20
adminApi.MapPut("/merchants/{id:guid}", async (Guid id, MerchantInput input, MerchantService svc) =>
{
    var merchant = await svc.UpdateMerchant(id, input);
    return Results.Ok(merchant);
});

// DELETE /api/merchants/{id} — Req 20
adminApi.MapDelete("/merchants/{id:guid}", async (Guid id, MerchantService svc) =>
{
    await svc.DeactivateMerchant(id);
    return Results.Ok(new { status = "deactivated" });
});

// ===================================================================
// Merchant User Endpoints (Admin)
// ===================================================================

// POST /api/merchants/{id}/users — Req 20
adminApi.MapPost("/merchants/{id:guid}/users", async (Guid id, MerchantUserInput input, MerchantService svc) =>
{
    var user = await svc.CreateMerchantUser(id, input);
    return Results.Created($"/api/merchants/{id}/users", user);
});

// GET /api/merchants/{id}/users — Req 20
adminApi.MapGet("/merchants/{id:guid}/users", async (Guid id, MerchantService svc) =>
{
    var users = await svc.GetMerchantUsers(id);
    return Results.Ok(users);
});

// ===================================================================
// Loyalty Rule Endpoints (MerchantUser)
// ===================================================================

// POST /api/loyalty-rules — Req 20
merchantApi.MapPost("/loyalty-rules", async (LoyaltyRuleCreateRequest req, LoyaltyRuleService svc) =>
{
    var rule = await svc.CreateRule(req.MerchantId, new LoyaltyRuleInput(req.RuleType, req.PurchaseThreshold, req.PointsValue, req.PaymentMethod));
    return Results.Created($"/api/loyalty-rules/{rule.Id}", rule);
});

// GET /api/loyalty-rules/{merchantId} — Req 20
merchantApi.MapGet("/loyalty-rules/{merchantId:guid}", async (Guid merchantId, LoyaltyRuleService svc) =>
{
    var rules = await svc.GetRules(merchantId);
    return Results.Ok(rules);
});

// PUT /api/loyalty-rules/{id} — Req 20
merchantApi.MapPut("/loyalty-rules/{id:guid}", async (Guid id, LoyaltyRuleInput input, LoyaltyRuleService svc) =>
{
    var rule = await svc.UpdateRule(id, input);
    return Results.Ok(rule);
});

// ===================================================================
// Promotion Endpoints (MerchantUser for create, Consumer for read)
// ===================================================================

// POST /api/promotions — Req 21
merchantApi.MapPost("/promotions", async (PromotionCreateRequest req, PromotionService svc) =>
{
    var input = new PromotionInput(req.Description, req.Category, req.RequiredPoints, req.TermsConditions, req.ValidFrom, req.ValidUntil);
    var promotion = await svc.CreatePromotion(req.MerchantId, input);
    return Results.Created($"/api/promotions/{promotion.Id}", promotion);
});

// GET /api/promotions — Req 21 (accessible to all authenticated users)
api.MapGet("/promotions", async (Guid? merchantId, string? category, PromotionService svc) =>
{
    var filter = (merchantId.HasValue || !string.IsNullOrEmpty(category))
        ? new PromotionFilter(merchantId, category)
        : null;
    var promotions = await svc.GetActivePromotions(filter);
    return Results.Ok(promotions);
});

// GET /api/promotions/{id} — Req 21 (accessible to all authenticated users)
api.MapGet("/promotions/{id:guid}", async (Guid id, PromotionService svc) =>
{
    var promotion = await svc.GetPromotion(id);
    return Results.Ok(promotion);
});

// ===================================================================
// Notification Endpoints (Consumer)
// ===================================================================

// GET /api/notifications — Req 19
consumerApi.MapGet("/notifications", async (HttpContext ctx, NotificationService svc) =>
{
    var userId = GetUserId(ctx);
    var notifications = await svc.GetUnread(userId);
    return Results.Ok(notifications);
});

// PATCH /api/notifications/{id}/read — Req 19
consumerApi.MapPatch("/notifications/{id:guid}/read", async (Guid id, NotificationService svc) =>
{
    await svc.MarkAsRead(id);
    return Results.Ok(new { status = "read" });
});

// ===================================================================
// Dashboard Endpoint (MerchantUser / Admin)
// ===================================================================

// GET /api/dashboard/overview — Req 11
merchantApi.MapGet("/dashboard/overview", async (
    Guid? merchantId, string? period,
    RedemptionService svc) =>
{
    // Build filter scoped to merchant if provided
    DateTimeOffset? fromDate = (period?.ToLowerInvariant()) switch
    {
        "daily" => DateTimeOffset.UtcNow.Date,
        "weekly" => DateTimeOffset.UtcNow.AddDays(-7),
        "monthly" => DateTimeOffset.UtcNow.AddDays(-30),
        _ => null
    };

    var filter = new TransactionFilter(null, merchantId, fromDate, null, null, null);
    var result = await svc.GetTransactions(filter, 1, int.MaxValue);

    return Results.Ok(new
    {
        TransactionCount = result.TotalCount,
        TotalPointsRedeemed = result.Items.Sum(t => t.PointsRedeemed),
        TotalMonetaryValue = result.Items.Sum(t => t.MonetaryValue)
    });
});

// ---------------------------------------------------------------------------
// Helper: Extract user ID from JWT claims
// ---------------------------------------------------------------------------
static Guid GetUserId(HttpContext ctx)
{
    var sub = ctx.User.FindFirst("sub")?.Value
        ?? ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    if (sub is null || !Guid.TryParse(sub, out var userId))
        throw new ValidationException("Unable to determine user identity from token.");

    return userId;
}

app.Run();
