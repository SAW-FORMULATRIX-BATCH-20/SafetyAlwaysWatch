namespace SafetyAlwaysWatch.Application.Common;

public class ServiceResult<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, string[]> ValidationErrors { get; set; } = new();

    public static ServiceResult<T> Success(T data) => new()
    {
        IsSuccess = true,
        Data = data
    };

    public static ServiceResult<T> Failure(string errorMessage) => new()
    {
        IsSuccess = false,
        ErrorMessage = errorMessage
    };

    public static ServiceResult<T> ValidationFailure(Dictionary<string, string[]> validationErrors) => new()
    {
        IsSuccess = false,
        ErrorMessage = "Validation failed.",
        ValidationErrors = validationErrors
    };
}
