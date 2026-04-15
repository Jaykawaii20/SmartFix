namespace SmartFix.API.Models;

public class Ticket
{
    public int Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty; // e.g. SA2026-001
    public string RequesterEmail { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string FormType { get; set; } = "Support"; // Support, Request, Incident
    public string Application { get; set; } = string.Empty; // SAP, VoIP, Dataverse, etc.
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Category { get; set; } = string.Empty; // System, Network, Software, Hardware
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Transferred, Resolved, Disapproved, Cancelled
    public string SlaStatus { get; set; } = "OnTime"; // OnTime, Delayed, Overdue
    public int SlaHours { get; set; } = 8; // SLA deadline in hours
    public string Level { get; set; } = "L1"; // L1, L2, L3, L4

    public int RequesterId { get; set; }
    public User Requester { get; set; } = null!;

    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime SlaDeadline { get; set; }
}
