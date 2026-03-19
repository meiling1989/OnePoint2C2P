using System.Text.Json.Serialization;

namespace OnePoint.Api.Models;

/// <summary>
/// Standard API error response envelope matching the design format:
/// <code>{ "error": { "code": "...", "message": "...", "details": {} } }</code>
/// </summary>
public record ErrorResponse(
    [property: JsonPropertyName("error")] ErrorDetail Error);

/// <summary>
/// Error detail containing a machine-readable code, human-readable message,
/// and optional structured details (e.g. validation field errors).
/// </summary>
public record ErrorDetail(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("details")] object? Details = null);
