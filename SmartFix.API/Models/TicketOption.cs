namespace SmartFix.API.Models;

public class TicketOption
{
    public int Id { get; set; }
    // "Priority" | "SupportCategory" | "ProblemCategory" | "SubCategory" | "Severity" | "PersonnelLevel"
    public string Category { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
