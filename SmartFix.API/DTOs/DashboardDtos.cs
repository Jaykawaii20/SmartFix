namespace SmartFix.API.DTOs;

public record DashboardDto(
    TicketDistributionDto TicketDistribution,
    IEnumerable<StaffWorkloadDto> StaffWorkload,
    SlaPerformanceDto SlaPerformance,
    KpiDto Kpis
);

public record TicketDistributionDto(
    int Transferred,
    int Pending,
    int Resolved,
    int Disapproved,
    int Cancelled,
    int Total
);

public record StaffWorkloadDto(
    string Name,
    string Level,
    string Department,
    int ActiveCount,
    int TotalCount
);

public record SlaPerformanceDto(
    int OnTimeResolved,
    int CriticalOverdue,
    int ActiveDelayed,
    bool SyncHealthy
);

public record KpiDto(
    double MttrHours,
    double FcrRate,
    double SlaCompliance,
    double CsatScore
);

public record StatusDto(
    int OnTimeCount,
    int DelayedCount,
    int OverdueCount,
    IEnumerable<TicketDto> OnTimeTickets,
    IEnumerable<TicketDto> DelayedTickets,
    IEnumerable<TicketDto> OverdueTickets
);

public record ReportsDto(
    TicketDistributionDto TicketDistribution,
    IEnumerable<SlaStatusDto> SlaStatuses,
    KpiDto Kpis
);

public record SlaStatusDto(
    string TicketNumber,
    string Priority,
    int SlaHours,
    string SlaStatus,
    string RequesterName
);
