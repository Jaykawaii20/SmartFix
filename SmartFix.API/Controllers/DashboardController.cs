using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFix.API.Services;

namespace SmartFix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        return Ok(await _dashboard.GetDashboardAsync());
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        return Ok(await _dashboard.GetStatusAsync());
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        return Ok(await _dashboard.GetReportsAsync());
    }
}
