using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFix.API.DTOs;
using SmartFix.API.Services;

namespace SmartFix.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IRolesService _roles;

    public UsersController(IRolesService roles) => _roles = roles;

    [HttpGet("me/permissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var permissions = await _roles.GetMyPermissionsAsync(userId);
        return Ok(permissions);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _roles.GetUsersAsync();
        return Ok(users);
    }

    [HttpPatch("{id}/role")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await _roles.UpdateUserRoleAsync(id, request.RoleId);
        return user == null ? NotFound() : Ok(user);
    }

    [HttpPatch("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ToggleUserActive(int id)
    {
        var user = await _roles.ToggleUserActiveAsync(id);
        return user == null ? NotFound() : Ok(user);
    }
}
