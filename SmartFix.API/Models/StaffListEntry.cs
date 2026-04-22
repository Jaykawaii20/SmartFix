namespace SmartFix.API.Models;

public class StaffListEntry
{
    public int Id { get; set; }
    // "L1" | "L2" | "L3" | "L4" | "Departments" | "BusinessUnits"
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
