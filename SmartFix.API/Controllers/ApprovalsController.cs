using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFix.API.DTOs;
using SmartFix.API.Services;

namespace SmartFix.API.Controllers;

[ApiController]
[Route("api/approvals")]
[Authorize]
public class ApprovalsController : ControllerBase
{
    private readonly IApprovalsService _approvals;

    public ApprovalsController(IApprovalsService approvals) => _approvals = approvals;

    // GET /api/approvals – tickets with a Pending step assigned to the current user
    [HttpGet]
    public async Task<IActionResult> GetApprovals()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _approvals.GetApprovalsAsync(userId);
        return Ok(result);
    }

    // POST /api/approvals/{id}/transfer – transfer ticket to the next level
    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> Transfer(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ok = await _approvals.TransferAsync(id, userId);
        if (!ok) return NotFound();
        return Ok();
    }

    // POST /api/approvals/{id}/resolve – resolve ticket with classification data
    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> Resolve(int id, [FromBody] ResolveTicketRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ok = await _approvals.ResolveAsync(id, userId, request);
        if (!ok) return NotFound();
        return Ok();
    }

    // POST /api/approvals/{id}/cancel – cancel ticket
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ok = await _approvals.CancelAsync(id, userId);
        if (!ok) return NotFound();
        return Ok();
    }
}
