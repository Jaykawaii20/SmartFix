namespace SmartFix.API.Models;

public class ApprovalStep
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    public int Level { get; set; } // 1, 2, 3, 4

    public int? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    public string AssigneeName { get; set; } = string.Empty; // stored for display

    public string Status { get; set; } = "Pending"; // Pending, Transferred, Approved, Disapproved
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
