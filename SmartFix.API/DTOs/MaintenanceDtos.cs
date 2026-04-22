namespace SmartFix.API.DTOs;

// ── Staff Lists ─────────────────────────────────────────────────────────────

public record StaffListsDto(
    List<string> L1,
    List<string> L2,
    List<string> L3,
    List<string> L4,
    List<string> Departments,
    List<string> BusinessUnits
);

// ── Ticket Options ──────────────────────────────────────────────────────────

public record TicketOptionsDto(
    List<string> Priorities,
    List<string> SupportCategories,
    List<string> ProblemCategories,
    List<string> SubCategories,
    List<string> Severities,
    List<string> PersonnelLevels
);

// ── Evaluation Form ─────────────────────────────────────────────────────────

public record EvalFormDto(
    string Title,
    string IntroMessage,
    List<EvalFormQuestionDto> Questions
);

public record EvalFormQuestionDto(int Id, string Text, string Type);

public record UpdateEvalFormRequest(
    string Title,
    string IntroMessage,
    List<UpdateEvalFormQuestionRequest> Questions
);

public record UpdateEvalFormQuestionRequest(int Id, string Text, string Type);

// ── Routing Rules ───────────────────────────────────────────────────────────

public record RoutingRuleDto(
    int Id,
    string Name,
    string? Description,
    string? FormType,
    string? Department,
    string AssignedLevel,
    int? AssigneeId,
    string? AssigneeName
);

public record CreateRoutingRuleRequest(
    string Name,
    string? Description,
    string? FormType,
    string? Department,
    string AssignedLevel,
    int? AssigneeId
);
