namespace OnePoint.Api.Services;

/// <summary>Thrown when a required resource is not found.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>Thrown when request data fails validation.</summary>
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}

/// <summary>Thrown when a consumer's balance is insufficient for the operation.</summary>
public class InsufficientBalanceException : Exception
{
    public decimal AvailableBalance { get; }

    public InsufficientBalanceException(decimal availableBalance)
        : base($"Insufficient balance. Available: {availableBalance}")
    {
        AvailableBalance = availableBalance;
    }
}

/// <summary>Thrown when no active loyalty rule is configured for a merchant.</summary>
public class NoRuleConfiguredException : Exception
{
    public NoRuleConfiguredException(string message) : base(message) { }
}
