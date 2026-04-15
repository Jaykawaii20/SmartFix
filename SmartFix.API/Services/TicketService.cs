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

    public TicketService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TicketListResponse> GetTicketsAsync(int userId, string? status, string? search)
    {
        var user = await _db.Users.FindAsync(userId);
        var query = _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .AsQueryable();

        // Employees only see their own tickets
        if (user?.Role == "Employee")
            query = query.Where(t => t.RequesterId == userId);

        if (!string.IsNullOrEmpty(status) && status != "All")
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(t =>
                t.TicketNumber.Contains(search) ||
                t.Description.Contains(search));

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        var isEmployee = user?.Role == "Employee";
        var all = await _db.Tickets.Where(t => !isEmployee || t.RequesterId == userId).ToListAsync();

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
            .FirstOrDefaultAsync(t => t.Id == id);

        return ticket == null ? null : MapToDto(ticket);
    }

    public async Task<TicketDto> CreateTicketAsync(CreateTicketRequest request, int requesterId)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.Tickets.CountAsync() + 1;
        var ticketNumber = $"SA{year}-{count:D3}";

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
            RequesterEmail = request.RequesterEmail,
            Department = request.Department,
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
            SlaDeadline = DateTime.UtcNow.AddHours(slaHours)
        };

        _db.Tickets.Add(ticket);

        var notification = new Notification
        {
            UserId = requesterId,
            Message = $"Your ticket {ticketNumber} has been submitted.",
            TicketNumber = ticketNumber
        };
        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();

        return MapToDto(await _db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .FirstAsync(t => t.Id == ticket.Id));
    }

    public async Task<TicketDto?> UpdateStatusAsync(int id, UpdateTicketStatusRequest request)
    {
        var ticket = await _db.Tickets.Include(t => t.Requester).FirstOrDefaultAsync(t => t.Id == id);
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

    private static TicketDto MapToDto(Ticket t) => new(
        t.Id, t.TicketNumber, t.RequesterEmail,
        t.Requester?.FullName ?? "",
        t.Department, t.FormType, t.Application,
        t.Priority, t.Category, t.Description,
        t.Status, t.SlaStatus, t.SlaHours, t.Level,
        t.AssignedTo?.FullName,
        t.CreatedAt, t.SlaDeadline
    );
}
