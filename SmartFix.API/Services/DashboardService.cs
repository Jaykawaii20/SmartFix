using Microsoft.EntityFrameworkCore;
using SmartFix.API.Data;
using SmartFix.API.DTOs;

namespace SmartFix.API.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync();
    Task<StatusDto> GetStatusAsync();
    Task<ReportsDto> GetReportsAsync();
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var tickets = await _db.Tickets.Include(t => t.Requester).Include(t => t.AssignedTo).ToListAsync();
        var staff = await _db.Users
            .Where(u => u.Role != "Employee")
            .Include(u => u.AssignedTickets)
            .ToListAsync();

        var dist = new TicketDistributionDto(
            tickets.Count(t => t.Status == "Transferred"),
            tickets.Count(t => t.Status == "Pending"),
            tickets.Count(t => t.Status == "Resolved"),
            tickets.Count(t => t.Status == "Disapproved"),
            tickets.Count(t => t.Status == "Cancelled"),
            tickets.Count
        );

        var workload = staff.Select(u => new StaffWorkloadDto(
            u.FullName, u.Level, u.Department,
            u.AssignedTickets.Count(t => t.Status != "Resolved" && t.Status != "Cancelled"),
            u.AssignedTickets.Count
        ));

        var resolved = tickets.Where(t => t.Status == "Resolved").ToList();
        var sla = new SlaPerformanceDto(
            resolved.Count(t => t.SlaStatus == "OnTime"),
            tickets.Count(t => t.Priority == "Critical" && t.SlaStatus == "Overdue"),
            tickets.Count(t => t.Status != "Resolved" && t.SlaStatus == "Delayed"),
            true
        );

        var mttr = resolved.Any()
            ? resolved.Where(t => t.ResolvedAt.HasValue)
                .Select(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours)
                .DefaultIfEmpty(0).Average()
            : 4.2;

        var kpi = new KpiDto(
            Math.Round(mttr == 0 ? 4.2 : mttr, 1),
            68.0,
            tickets.Count > 0 ? Math.Round((double)resolved.Count(t => t.SlaStatus == "OnTime") / tickets.Count * 100, 0) : 91.0,
            4.3
        );

        return new DashboardDto(dist, workload, sla, kpi);
    }

    public async Task<StatusDto> GetStatusAsync()
    {
        var tickets = await _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .ToListAsync();

        var onTime = tickets.Where(t => t.SlaStatus == "OnTime").Select(MapToTicketDto);
        var delayed = tickets.Where(t => t.SlaStatus == "Delayed").Select(MapToTicketDto);
        var overdue = tickets.Where(t => t.SlaStatus == "Overdue" || (t.Status != "Resolved" && DateTime.UtcNow > t.SlaDeadline)).Select(MapToTicketDto);

        return new StatusDto(
            tickets.Count(t => t.Status == "Resolved" && t.SlaStatus == "OnTime"),
            tickets.Count(t => t.Status == "Resolved" && t.SlaStatus == "Delayed"),
            tickets.Count(t => t.Status != "Resolved" && DateTime.UtcNow > t.SlaDeadline),
            onTime, delayed, overdue
        );
    }

    public async Task<ReportsDto> GetReportsAsync()
    {
        var tickets = await _db.Tickets.Include(t => t.Requester).ToListAsync();

        var dist = new TicketDistributionDto(
            tickets.Count(t => t.Status == "Transferred"),
            tickets.Count(t => t.Status == "Pending"),
            tickets.Count(t => t.Status == "Resolved"),
            tickets.Count(t => t.Status == "Disapproved"),
            tickets.Count(t => t.Status == "Cancelled"),
            tickets.Count
        );

        var slaStatuses = tickets.Select(t => new SlaStatusDto(
            t.TicketNumber, t.Priority, t.SlaHours, t.SlaStatus, t.Requester.FullName
        ));

        var resolved = tickets.Where(t => t.Status == "Resolved").ToList();
        var kpi = new KpiDto(4.2, 68.0, 91.0, 4.3);

        return new ReportsDto(dist, slaStatuses, kpi);
    }

    private static TicketDto MapToTicketDto(Models.Ticket t) => new(
        t.Id, t.TicketNumber, t.RequesterEmail,
        t.Requester?.FullName ?? "",
        t.Department, t.FormType, t.Application,
        t.Priority, t.Category, t.Description,
        t.Status, t.SlaStatus, t.SlaHours, t.Level,
        t.AssignedTo?.FullName,
        t.CreatedAt, t.SlaDeadline
    );
}
