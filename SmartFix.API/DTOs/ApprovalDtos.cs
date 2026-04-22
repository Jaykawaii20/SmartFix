namespace SmartFix.API.DTOs;

public record ApprovalStepDto(
    int Level,
    string AssigneeName,
    string Status,
    string? Note
);

public record ApprovalsListResponse(
    IEnumerable<TicketDto> Tickets,
    int Count
);

public record ResolveTicketRequest(
    string Priority,
    string SupportCategory,
    string ProblemCategory,
    string SubCategory,
    string Severity,
    string PersonnelLevel,
    string TroubleshootingDescription
);
