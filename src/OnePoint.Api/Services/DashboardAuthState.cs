namespace OnePoint.Api.Services;

/// <summary>
/// Holds the authenticated dashboard user's session state.
/// Stored in session/scoped DI and cascaded to Blazor components.
/// </summary>
public class DashboardAuthState
{
    public bool IsAuthenticated { get; set; } = true;
    public Guid UserId { get; set; } = new Guid("b06d6060-4261-4016-9a7c-30f81a22123b");
    public Guid? MerchantId { get; set; } = new Guid("a0000000-0000-0000-0000-000000000001");
    public string Role { get; set; } = "admin";
    public string Email { get; set; } = "tinmaylinn@gmail.com";
    public string AccessToken { get; set; } = "";
}
