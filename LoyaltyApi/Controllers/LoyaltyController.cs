using Microsoft.AspNetCore.Mvc;
using LoyaltyApi.Models;
using LoyaltyApi.Services;

namespace LoyaltyApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _service;

    public LoyaltyController(ILoyaltyService service) => _service = service;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var result = await _service.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem([FromBody] RedeemRequest request)
    {
        try
        {
            var result = await _service.RedeemAsync(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest request)
    {
        try
        {
            var result = await _service.GeneratePointsAsync(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("swap")]
    public async Task<IActionResult> Swap([FromBody] SwapRequest request)
    {
        try
        {
            var result = await _service.SwapPointsAsync(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("points/{userId}")]
    public async Task<IActionResult> GetPoints(int userId)
    {
        try
        {
            var result = await _service.GetPointsAsync(userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("transactions/{userId}")]
    public async Task<IActionResult> GetTransactions(int userId)
    {
        try
        {
            var result = await _service.GetTransactionsAsync(userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("notify")]
    public async Task<IActionResult> Notify([FromBody] NotificationRequest request)
    {
        try
        {
            var result = await _service.SendNotificationAsync(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
