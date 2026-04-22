using Microsoft.EntityFrameworkCore;
using SmartFix.API.Data;
using SmartFix.API.DTOs;
using SmartFix.API.Models;

namespace SmartFix.API.Services;

public interface IApprovalsService
{
    Task<ApprovalsListResponse> GetApprovalsAsync(int userId);
    Task<bool> TransferAsync(int ticketId, int userId);
    Task<bool> ResolveAsync(int ticketId, int userId, ResolveTicketRequest request);
    Task<bool> CancelAsync(int ticketId, int userId);
}

public class ApprovalsService : IApprovalsService
{
    private readonly AppDbContext _db;

    public ApprovalsService(AppDbContext db) => _db = db;

    // Returns all tickets where the current user has a Pending ApprovalStep
    public async Task<ApprovalsListResponse> GetApprovalsAsync(int userId)
    {
        var ticketIds = await _db.ApprovalSteps
            .Where(s => s.AssigneeId == userId && s.Status == "Pending")
            .Select(s => s.TicketId)
            .Distinct()
            .ToListAsync();

        var tickets = await _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .Include(t => t.ApprovalSteps.OrderBy(s => s.Level))
            .Where(t => ticketIds.Contains(t.Id))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var dtos = tickets.Select(MapToDto).ToList();
        return new ApprovalsListResponse(dtos, dtos.Count);
    }

    // Mark current step Transferred, create next-level step
    public async Task<bool> TransferAsync(int ticketId, int userId)
    {
        var step = await GetPendingStepForUser(ticketId, userId);
        if (step == null) return false;

        step.Status = "Transferred";
        step.CompletedAt = DateTime.UtcNow;

        var nextLevel = step.Level + 1;
        var ticket = step.Ticket ?? await _db.Tickets.FindAsync(ticketId);
        if (ticket == null) return false;

        // Find next-level assignee from staff list entries
        var levelKey = $"L{nextLevel}";
        var staffNames = await _db.StaffListEntries
            .Where(e => e.Category == levelKey)
            .Select(e => e.Name)
            .ToListAsync();

        User? nextAssignee = null;
        foreach (var name in staffNames)
        {
            nextAssignee = await _db.Users.FirstOrDefaultAsync(u => u.FullName == name && u.IsActive);
            if (nextAssignee != null) break;
        }

        // Fallback: any active user with matching Level field
        nextAssignee ??= await _db.Users
            .Where(u => u.Level == levelKey && u.IsActive)
            .FirstOrDefaultAsync();

        var nextStep = new ApprovalStep
        {
            TicketId = ticketId,
            Level = nextLevel,
            AssigneeId = nextAssignee?.Id,
            AssigneeName = nextAssignee?.FullName ?? $"Level {nextLevel} Staff",
            Status = "Pending",
        };
        _db.ApprovalSteps.Add(nextStep);

        ticket.Level = levelKey;
        ticket.Status = "Transferred";
        ticket.UpdatedAt = DateTime.UtcNow;

        // Notify next assignee
        if (nextAssignee != null)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = nextAssignee.Id,
                Message = $"Ticket {ticket.TicketNumber} has been transferred to you (L{nextLevel}).",
                TicketNumber = ticket.TicketNumber,
            });
        }

        await _db.SaveChangesAsync();
        return true;
    }

    // Mark current step Approved, resolve ticket, save resolve fields
    public async Task<bool> ResolveAsync(int ticketId, int userId, ResolveTicketRequest request)
    {
        var step = await GetPendingStepForUser(ticketId, userId);
        if (step == null) return false;

        step.Status = "Approved";
        step.CompletedAt = DateTime.UtcNow;

        var ticket = step.Ticket ?? await _db.Tickets
            .Include(t => t.Requester)
            .FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null) return false;

        ticket.Status = "Resolved";
        ticket.ResolvedAt = DateTime.UtcNow;
        ticket.UpdatedAt = DateTime.UtcNow;
        ticket.Priority = request.Priority;
        ticket.SupportCategory = request.SupportCategory;
        ticket.ProblemCategory = request.ProblemCategory;
        ticket.SubCategory = request.SubCategory;
        ticket.Severity = request.Severity;
        ticket.PersonnelLevel = request.PersonnelLevel;
        ticket.TroubleshootingDescription = request.TroubleshootingDescription;

        // Notify requester
        _db.Notifications.Add(new Notification
        {
            UserId = ticket.RequesterId,
            Message = $"Your ticket {ticket.TicketNumber} has been resolved.",
            TicketNumber = ticket.TicketNumber,
        });

        await _db.SaveChangesAsync();
        return true;
    }

    // Mark current step Disapproved, cancel ticket
    public async Task<bool> CancelAsync(int ticketId, int userId)
    {
        var step = await GetPendingStepForUser(ticketId, userId);
        if (step == null) return false;

        step.Status = "Disapproved";
        step.CompletedAt = DateTime.UtcNow;

        var ticket = step.Ticket ?? await _db.Tickets.FindAsync(ticketId);
        if (ticket == null) return false;

        ticket.Status = "Cancelled";
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private async Task<ApprovalStep?> GetPendingStepForUser(int ticketId, int userId)
    {
        return await _db.ApprovalSteps
            .Include(s => s.Ticket)
            .FirstOrDefaultAsync(s => s.TicketId == ticketId && s.AssigneeId == userId && s.Status == "Pending");
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
