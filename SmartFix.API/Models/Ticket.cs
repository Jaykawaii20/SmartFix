namespace SmartFix.API.Models;

public class Ticket
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty; // e.g. SA2026-001
    public string? ScaNumber { get; set; }                   // e.g. SCA-2026-0001
    public string RequesterEmail { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? BusinessUnit { get; set; }
    public string FormType { get; set; } = "Support"; // Support, Request, Incident
    public string Application { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Transferred, Resolved, Disapproved, Cancelled
    public string SlaStatus { get; set; } = "OnTime"; // OnTime, Delayed, Overdue
    public int SlaHours { get; set; } = 8;
    public string Level { get; set; } = "L1"; // L1, L2, L3, L4

    // Resolve classification fields – filled when ticket is resolved
    public string? SupportCategory { get; set; }
    public string? ProblemCategory { get; set; }
    public string? SubCategory { get; set; }
    public string? Severity { get; set; }
    public string? PersonnelLevel { get; set; }
    public string? TroubleshootingDescription { get; set; }

    public int RequesterId { get; set; }
    public User Requester { get; set; } = null!;

    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime SlaDeadline { get; set; }

    public ICollection<ApprovalStep> ApprovalSteps { get; set; } = new List<ApprovalStep>();
}
