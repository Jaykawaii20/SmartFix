using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFix.API.DTOs;
using SmartFix.API.Services;

namespace SmartFix.API.Controllers;

[ApiController]
[Route("api/maintenance")]
[Authorize(Roles = "SuperAdmin")]
public class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceService _maintenance;

    public MaintenanceController(IMaintenanceService maintenance) => _maintenance = maintenance;

    // ── Staff Lists ─────────────────────────────────────────────────────────

    [HttpGet("staff-lists")]
    public async Task<IActionResult> GetStaffLists()
    {
        var result = await _maintenance.GetStaffListsAsync();
        return Ok(result);
    }

    [HttpPut("staff-lists")]
    public async Task<IActionResult> UpdateStaffLists([FromBody] StaffListsDto request)
    {
        await _maintenance.UpdateStaffListsAsync(request);
        return Ok();
    }

    // ── Routing Rules ───────────────────────────────────────────────────────

    [HttpGet("routing")]
    public async Task<IActionResult> GetRoutingRules()
    {
        var rules = await _maintenance.GetRoutingRulesAsync();
        return Ok(rules);
    }

    [HttpPost("routing")]
    public async Task<IActionResult> CreateRoutingRule([FromBody] CreateRoutingRuleRequest request)
    {
        var rule = await _maintenance.CreateRoutingRuleAsync(request);
        return Ok(rule);
    }

    [HttpDelete("routing/{id}")]
    public async Task<IActionResult> DeleteRoutingRule(int id)
    {
        var deleted = await _maintenance.DeleteRoutingRuleAsync(id);
        if (!deleted) return NotFound();
        return Ok();
    }

    // ── Ticket Options ──────────────────────────────────────────────────────

    [HttpGet("ticket-options")]
    public async Task<IActionResult> GetTicketOptions()
    {
        var options = await _maintenance.GetTicketOptionsAsync();
        return Ok(options);
    }

    [HttpPut("ticket-options")]
    public async Task<IActionResult> UpdateTicketOptions([FromBody] TicketOptionsDto request)
    {
        await _maintenance.UpdateTicketOptionsAsync(request);
        return Ok();
    }

    // ── Evaluation Form ─────────────────────────────────────────────────────

    [HttpGet("eval-form")]
    public async Task<IActionResult> GetEvalForm()
    {
        var form = await _maintenance.GetEvalFormAsync();
        return Ok(form);
    }

    [HttpPut("eval-form")]
    public async Task<IActionResult> UpdateEvalForm([FromBody] UpdateEvalFormRequest request)
    {
        await _maintenance.UpdateEvalFormAsync(request);
        return Ok();
    }
}
