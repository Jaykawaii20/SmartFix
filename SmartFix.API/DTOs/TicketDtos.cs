namespace SmartFix.API.DTOs;

public record CreateTicketRequest(
    string RequesterEmail,
    string Department,
    string? BusinessUnit,
    string FormType,
    string Application,
    string Priority,
    string Category,
    string Description
);

public record TicketDto(
    int Id,
    string TicketNumber,
    string? ScaNumber,
    string RequesterEmail,
    string RequesterName,
    string Department,
    string? BusinessUnit,
    string FormType,
    string Application,
    string Priority,
    string Category,
    string Description,
    string Status,
    string SlaStatus,
    int SlaHours,
    string Level,
    string? AssignedToName,
    DateTime CreatedAt,
    DateTime SlaDeadline,
    List<ApprovalStepDto> ApprovalChain
);

public record UpdateTicketStatusRequest(
    string Status,
    string? AssignedToId
);

public record TicketListResponse(
    IEnumerable<TicketDto> Tickets,
    int TotalCount,
    int PendingCount,
    int TransferredCount,
    int ResolvedCount,
    int DisapprovedCount,
    int CancelledCount
);
