using Microsoft.EntityFrameworkCore;
using SmartFix.API.Data;
using SmartFix.API.DTOs;
using SmartFix.API.Models;

namespace SmartFix.API.Services;

public interface IMaintenanceService
{
    Task<StaffListsDto> GetStaffListsAsync();
    Task UpdateStaffListsAsync(StaffListsDto request);
    Task<List<RoutingRuleDto>> GetRoutingRulesAsync();
    Task<RoutingRuleDto> CreateRoutingRuleAsync(CreateRoutingRuleRequest request);
    Task<bool> DeleteRoutingRuleAsync(int id);
    Task<TicketOptionsDto> GetTicketOptionsAsync();
    Task UpdateTicketOptionsAsync(TicketOptionsDto request);
    Task<EvalFormDto> GetEvalFormAsync();
    Task UpdateEvalFormAsync(UpdateEvalFormRequest request);
}

public class MaintenanceService : IMaintenanceService
{
    private readonly AppDbContext _db;

    public MaintenanceService(AppDbContext db) => _db = db;

    // ── Staff Lists ─────────────────────────────────────────────────────────

    public async Task<StaffListsDto> GetStaffListsAsync()
    {
        var entries = await _db.StaffListEntries.ToListAsync();
        return new StaffListsDto(
            L1: entries.Where(e => e.Category == "L1").Select(e => e.Name).ToList(),
            L2: entries.Where(e => e.Category == "L2").Select(e => e.Name).ToList(),
            L3: entries.Where(e => e.Category == "L3").Select(e => e.Name).ToList(),
            L4: entries.Where(e => e.Category == "L4").Select(e => e.Name).ToList(),
            Departments: entries.Where(e => e.Category == "Departments").Select(e => e.Name).ToList(),
            BusinessUnits: entries.Where(e => e.Category == "BusinessUnits").Select(e => e.Name).ToList()
        );
    }

    public async Task UpdateStaffListsAsync(StaffListsDto request)
    {
        // Replace all entries for each category
        var categoryMap = new Dictionary<string, List<string>>
        {
            ["L1"] = request.L1,
            ["L2"] = request.L2,
            ["L3"] = request.L3,
            ["L4"] = request.L4,
            ["Departments"] = request.Departments,
            ["BusinessUnits"] = request.BusinessUnits,
        };

        foreach (var (category, names) in categoryMap)
        {
            var existing = await _db.StaffListEntries.Where(e => e.Category == category).ToListAsync();
            _db.StaffListEntries.RemoveRange(existing);
            _db.StaffListEntries.AddRange(names.Select(n => new StaffListEntry { Category = category, Name = n }));
        }

        await _db.SaveChangesAsync();
    }

    // ── Routing Rules ───────────────────────────────────────────────────────

    public async Task<List<RoutingRuleDto>> GetRoutingRulesAsync()
    {
        var rules = await _db.RoutingRules.Include(r => r.Assignee).OrderBy(r => r.CreatedAt).ToListAsync();
        return rules.Select(r => new RoutingRuleDto(r.Id, r.Name, r.Description, r.FormType, r.Department, r.AssignedLevel, r.AssigneeId, r.Assignee?.FullName)).ToList();
    }

    public async Task<RoutingRuleDto> CreateRoutingRuleAsync(CreateRoutingRuleRequest request)
    {
        var rule = new RoutingRule
        {
            Name = request.Name,
            Description = request.Description,
            FormType = request.FormType,
            Department = request.Department,
            AssignedLevel = request.AssignedLevel,
            AssigneeId = request.AssigneeId,
        };
        _db.RoutingRules.Add(rule);
        await _db.SaveChangesAsync();
        await _db.Entry(rule).Reference(r => r.Assignee).LoadAsync();
        return new RoutingRuleDto(rule.Id, rule.Name, rule.Description, rule.FormType, rule.Department, rule.AssignedLevel, rule.AssigneeId, rule.Assignee?.FullName);
    }

    public async Task<bool> DeleteRoutingRuleAsync(int id)
    {
        var rule = await _db.RoutingRules.FindAsync(id);
        if (rule == null) return false;
        _db.RoutingRules.Remove(rule);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Ticket Options ──────────────────────────────────────────────────────

    public async Task<TicketOptionsDto> GetTicketOptionsAsync()
    {
        var options = await _db.TicketOptions.OrderBy(o => o.DisplayOrder).ToListAsync();
        return new TicketOptionsDto(
            Priorities: options.Where(o => o.Category == "Priority").Select(o => o.Value).ToList(),
            SupportCategories: options.Where(o => o.Category == "SupportCategory").Select(o => o.Value).ToList(),
            ProblemCategories: options.Where(o => o.Category == "ProblemCategory").Select(o => o.Value).ToList(),
            SubCategories: options.Where(o => o.Category == "SubCategory").Select(o => o.Value).ToList(),
            Severities: options.Where(o => o.Category == "Severity").Select(o => o.Value).ToList(),
            PersonnelLevels: options.Where(o => o.Category == "PersonnelLevel").Select(o => o.Value).ToList()
        );
    }

    public async Task UpdateTicketOptionsAsync(TicketOptionsDto request)
    {
        var categoryMap = new Dictionary<string, List<string>>
        {
            ["Priority"] = request.Priorities,
            ["SupportCategory"] = request.SupportCategories,
            ["ProblemCategory"] = request.ProblemCategories,
            ["SubCategory"] = request.SubCategories,
            ["Severity"] = request.Severities,
            ["PersonnelLevel"] = request.PersonnelLevels,
        };

        foreach (var (category, values) in categoryMap)
        {
            var existing = await _db.TicketOptions.Where(o => o.Category == category).ToListAsync();
            _db.TicketOptions.RemoveRange(existing);
            _db.TicketOptions.AddRange(values.Select((v, i) => new TicketOption { Category = category, Value = v, DisplayOrder = i }));
        }

        await _db.SaveChangesAsync();
    }

    // ── Evaluation Form ─────────────────────────────────────────────────────

    public async Task<EvalFormDto> GetEvalFormAsync()
    {
        var config = await _db.EvalFormConfigs
            .Include(c => c.Questions.OrderBy(q => q.DisplayOrder))
            .FirstOrDefaultAsync();

        if (config == null)
        {
            config = new EvalFormConfig();
            _db.EvalFormConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return new EvalFormDto(
            config.Title,
            config.IntroMessage,
            config.Questions.Select(q => new EvalFormQuestionDto(q.Id, q.Text, q.Type)).ToList()
        );
    }

    public async Task UpdateEvalFormAsync(UpdateEvalFormRequest request)
    {
        var config = await _db.EvalFormConfigs
            .Include(c => c.Questions)
            .FirstOrDefaultAsync();

        if (config == null)
        {
            config = new EvalFormConfig();
            _db.EvalFormConfigs.Add(config);
        }

        config.Title = request.Title;
        config.IntroMessage = request.IntroMessage;

        // Replace questions
        _db.EvalFormQuestions.RemoveRange(config.Questions);
        config.Questions = request.Questions.Select((q, i) => new EvalFormQuestion
        {
            Text = q.Text,
            Type = q.Type,
            DisplayOrder = i,
            EvalFormConfigId = config.Id,
        }).ToList();

        await _db.SaveChangesAsync();
    }
}
