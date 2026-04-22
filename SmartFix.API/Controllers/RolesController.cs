using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFix.API.DTOs;
using SmartFix.API.Services;

namespace SmartFix.API.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize(Roles = "SuperAdmin")]
public class RolesController : ControllerBase
{
    private readonly IRolesService _roles;

    public RolesController(IRolesService roles) => _roles = roles;

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roles.GetRolesAsync();
        return Ok(roles);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRole(int id)
    {
        var role = await _roles.GetRoleByIdAsync(id);
        return role == null ? NotFound() : Ok(role);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        var role = await _roles.CreateRoleAsync(request);
        return Ok(role);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        var role = await _roles.UpdateRoleAsync(id, request);
        return role == null ? NotFound() : Ok(role);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        var deleted = await _roles.DeleteRoleAsync(id);
        if (!deleted) return BadRequest(new { message = "Role not found or is a system role." });
        return Ok();
    }
}
