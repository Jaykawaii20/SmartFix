namespace SmartFix.API.Models;

public class RoutingRule
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FormType { get; set; }   // e.g. Support, Request, Incident
    public string? Department { get; set; } // e.g. IT, Finance
    public string AssignedLevel { get; set; } = "L1"; // L1, L2, L3, L4
    public int? AssigneeId { get; set; }    // direct user assignment (overrides level lookup)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Assignee { get; set; }
}
