using Microsoft.EntityFrameworkCore;
using SmartFix.API.Data;
using SmartFix.API.DTOs;
using SmartFix.API.Models;

namespace SmartFix.API.Services;

public interface ITicketService
{
    Task<TicketListResponse> GetTicketsAsync(int userId, string? status, string? search);
    Task<TicketDto?> GetTicketByIdAsync(int id);
    Task<TicketDto> CreateTicketAsync(CreateTicketRequest request, int requesterId);
    Task<TicketDto?> UpdateStatusAsync(int id, UpdateTicketStatusRequest request);
}

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;

    public TicketService(AppDbContext db) => _db = db;

    public async Task<TicketListResponse> GetTicketsAsync(int userId, string? status, string? search)
    {
        var user = await _db.Users.Include(u => u.UserRole).FirstOrDefaultAsync(u => u.Id == userId);
        var query = _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .Include(t => t.ApprovalSteps.OrderBy(s => s.Level))
            .AsQueryable();

        var isBasicUser = user?.UserRole?.Name is null or "User";
        if (isBasicUser)
            query = query.Where(t => t.RequesterId == userId);

        if (!string.IsNullOrEmpty(status) && status != "All")
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(t =>
                t.TicketNumber.Contains(search) ||
                t.Description.Contains(search));

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        var all = await _db.Tickets.Where(t => !isBasicUser || t.RequesterId == userId).ToListAsync();

        return new TicketListResponse(
            Tickets: tickets.Select(MapToDto),
            TotalCount: all.Count,
            PendingCount: all.Count(t => t.Status == "Pending"),
            TransferredCount: all.Count(t => t.Status == "Transferred"),
            ResolvedCount: all.Count(t => t.Status == "Resolved"),
            DisapprovedCount: all.Count(t => t.Status == "Disapproved"),
            CancelledCount: all.Count(t => t.Status == "Cancelled")
        );
    }

    public async Task<TicketDto?> GetTicketByIdAsync(int id)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .Include(t => t.ApprovalSteps.OrderBy(s => s.Level))
            .FirstOrDefaultAsync(t => t.Id == id);

        return ticket == null ? null : MapToDto(ticket);
    }

    public async Task<TicketDto> CreateTicketAsync(CreateTicketRequest request, int requesterId)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.Tickets.CountAsync() + 1;
        var ticketNumber = $"SA{year}-{count:D3}";
        var scaNumber = $"SCA-{year}-{count:D4}";

        var slaHours = request.Priority switch
        {
            "Critical" => 48,
            "High" => 5,
            "Medium" => 3,
            "Low" => 3,
            _ => 8
        };

        var ticket = new Ticket
        {
            TicketNumber = ticketNumber,
            ScaNumber = scaNumber,
            RequesterEmail = request.RequesterEmail,
            Department = request.Department,
            BusinessUnit = request.BusinessUnit,
            FormType = request.FormType,
            Application = request.Application,
            Priority = request.Priority,
            Category = request.Category,
            Description = request.Description,
            Status = "Pending",
            SlaStatus = "OnTime",
            SlaHours = slaHours,
            Level = "L1",
            RequesterId = requesterId,
            CreatedAt = DateTime.UtcNow,
            SlaDeadline = DateTime.UtcNow.AddHours(slaHours),
        };

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync(); // save to get ticket.Id

        // Build initial approval step (L1) via routing rules
        await CreateInitialApprovalStepAsync(ticket, request);

        _db.Notifications.Add(new Notification
        {
            UserId = requesterId,
            Message = $"Your ticket {ticketNumber} has been submitted.",
            TicketNumber = ticketNumber,
        });

        await _db.SaveChangesAsync();

        return MapToDto(await _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .Include(t => t.ApprovalSteps.OrderBy(s => s.Level))
            .FirstAsync(t => t.Id == ticket.Id));
    }

    public async Task<TicketDto?> UpdateStatusAsync(int id, UpdateTicketStatusRequest request)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.ApprovalSteps)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return null;

        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (request.Status == "Resolved")
            ticket.ResolvedAt = DateTime.UtcNow;

        if (request.AssignedToId != null && int.TryParse(request.AssignedToId, out int assignedId))
            ticket.AssignedToId = assignedId;

        await _db.SaveChangesAsync();
        return MapToDto(ticket);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private async Task CreateInitialApprovalStepAsync(Ticket ticket, CreateTicketRequest request)
    {
        // Find a matching routing rule (most-specific wins: FormType + Department)
        var rules = await _db.RoutingRules.ToListAsync();
        var rule = rules
            .OrderByDescending(r => (!string.IsNullOrEmpty(r.FormType) ? 1 : 0) + (!string.IsNullOrEmpty(r.Department) ? 1 : 0))
            .FirstOrDefault(r =>
                (string.IsNullOrEmpty(r.FormType) || r.FormType == request.FormType) &&
                (string.IsNullOrEmpty(r.Department) || r.Department == request.Department));

        var targetLevel = rule?.AssignedLevel ?? "L1";

        User? assignee = null;

        // Prefer direct user assignment from routing rule
        if (rule?.AssigneeId != null)
        {
            assignee = await _db.Users.FirstOrDefaultAsync(u => u.Id == rule.AssigneeId && u.IsActive);
        }

        if (assignee == null)
        {
            // Find assignee from staff list entries for target level
            var staffNames = await _db.StaffListEntries
                .Where(e => e.Category == targetLevel)
                .Select(e => e.Name)
                .ToListAsync();

            foreach (var name in staffNames)
            {
                assignee = await _db.Users.FirstOrDefaultAsync(u => u.FullName == name && u.IsActive);
                if (assignee != null) break;
            }
        }

        // Fallback: find any active user whose Level field matches
        assignee ??= await _db.Users
            .Where(u => u.Level == targetLevel && u.IsActive)
            .FirstOrDefaultAsync();

        if (assignee == null) return; // no staff configured yet; skip step creation

        var levelNumber = targetLevel switch { "L1" => 1, "L2" => 2, "L3" => 3, "L4" => 4, _ => 1 };

        _db.ApprovalSteps.Add(new ApprovalStep
        {
            TicketId = ticket.Id,
            Level = levelNumber,
            AssigneeId = assignee.Id,
            AssigneeName = assignee.FullName,
            Status = "Pending",
        });

        // Notify assignee
        _db.Notifications.Add(new Notification
        {
            UserId = assignee.Id,
            Message = $"New ticket {ticket.TicketNumber} has been assigned to you ({targetLevel}).",
            TicketNumber = ticket.TicketNumber,
        });
    }

    private static TicketDto MapToDto(Ticket t) => new(
        t.Id,
        t.TicketNumber,
        t.ScaNumber,
        t.RequesterEmail,
        t.Requester?.FullName ?? string.Empty,
        t.Department,
        t.BusinessUnit,
        t.FormType,
        t.Application,
        t.Priority,
        t.Category,
        t.Description,
        t.Status,
        t.SlaStatus,
        t.SlaHours,
        t.Level,
        t.AssignedTo?.FullName,
        t.CreatedAt,
        t.SlaDeadline,
        t.ApprovalSteps
            .OrderBy(s => s.Level)
            .Select(s => new ApprovalStepDto(s.Level, s.AssigneeName, s.Status, s.Note))
            .ToList()
    );
}
