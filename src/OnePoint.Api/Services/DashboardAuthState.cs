namespace OnePoint.Api.Services;

/// <summary>
/// Holds the authenticated dashboard user's session state.
/// Stored in session/scoped DI and cascaded to Blazor components.
/// </summary>
public class DashboardAuthState
{
    public bool IsAuthenticated { get; set; }
    public Guid UserId { get; set; }
    public Guid? MerchantId { get; set; }
    public string Role { get; set; } = "";
    public string Email { get; set; } = "";
    public string AccessToken { get; set; } = "";
}
