namespace SafetyAlwaysWatch.Application.DTOs.Employees;

public class GetEmployeesQuery
{
    public string? Search { get; set; }
    public string? Department { get; set; }

    // "Aman" atau "Kritis"
    public string? SafetyStatus { get; set; }

    public string? SortBy { get; set; } = "name"; // name, score
    public string? SortDirection { get; set; } = "asc"; // asc, desc

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
