namespace SmartFix.API.Models;

public class RolePermission
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    // dashboard | service_tracker | approvals | maintenance | reports | status | users | roles
    public string Module { get; set; } = string.Empty;
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }

    public Role Role { get; set; } = null!;
}
