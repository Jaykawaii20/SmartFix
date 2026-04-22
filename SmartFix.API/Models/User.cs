namespace SmartFix.API.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int? RoleId { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty; // L1, L2, L3, L4
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Role? UserRole { get; set; }
    public ICollection<Ticket> SubmittedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
