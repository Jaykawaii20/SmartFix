using Microsoft.EntityFrameworkCore;
using SmartFix.API.Data;
using SmartFix.API.DTOs;
using SmartFix.API.Models;

namespace SmartFix.API.Services;

public interface IRolesService
{
    Task<List<RoleDto>> GetRolesAsync();
    Task<RoleDto?> GetRoleByIdAsync(int id);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request);
    Task<RoleDto?> UpdateRoleAsync(int id, UpdateRoleRequest request);
    Task<bool> DeleteRoleAsync(int id);
    Task<List<UserDto>> GetUsersAsync();
    Task<UserDto?> UpdateUserRoleAsync(int userId, int roleId);
    Task<UserDto?> ToggleUserActiveAsync(int userId);
    Task<List<RolePermissionDto>> GetMyPermissionsAsync(int userId);
}

public class RolesService : IRolesService
{
    private readonly AppDbContext _db;

    public RolesService(AppDbContext db) => _db = db;

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        var roles = await _db.Roles.Include(r => r.Permissions).OrderBy(r => r.Id).ToListAsync();
        return roles.Select(MapRoleToDto).ToList();
    }

    public async Task<RoleDto?> GetRoleByIdAsync(int id)
    {
        var role = await _db.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == id);
        return role == null ? null : MapRoleToDto(role);
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
    {
        var role = new Role
        {
            Name = request.Name,
            Description = request.Description,
            IsDefault = false,
            IsSystem = false,
            Permissions = request.Permissions.Select(p => new RolePermission
            {
                Module = p.Module,
                CanView = p.CanView,
                CanCreate = p.CanCreate,
                CanEdit = p.CanEdit,
                CanDelete = p.CanDelete,
            }).ToList(),
        };

        _db.Roles.Add(role);
        await _db.SaveChangesAsync();
        return MapRoleToDto(role);
    }

    public async Task<RoleDto?> UpdateRoleAsync(int id, UpdateRoleRequest request)
    {
        var role = await _db.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return null;

        role.Name = request.Name;
        role.Description = request.Description;

        _db.RolePermissions.RemoveRange(role.Permissions);
        role.Permissions = request.Permissions.Select(p => new RolePermission
        {
            RoleId = role.Id,
            Module = p.Module,
            CanView = p.CanView,
            CanCreate = p.CanCreate,
            CanEdit = p.CanEdit,
            CanDelete = p.CanDelete,
        }).ToList();

        await _db.SaveChangesAsync();
        return MapRoleToDto(role);
    }

    public async Task<bool> DeleteRoleAsync(int id)
    {
        var role = await _db.Roles.FindAsync(id);
        if (role == null || role.IsSystem) return false;

        _db.Roles.Remove(role);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<UserDto>> GetUsersAsync()
    {
        var users = await _db.Users.Include(u => u.UserRole).OrderBy(u => u.FullName).ToListAsync();
        return users.Select(MapUserToDto).ToList();
    }

    public async Task<UserDto?> UpdateUserRoleAsync(int userId, int roleId)
    {
        var user = await _db.Users.Include(u => u.UserRole).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        var role = await _db.Roles.FindAsync(roleId);
        if (role == null) return null;

        user.RoleId = roleId;
        user.UserRole = role;
        await _db.SaveChangesAsync();
        return MapUserToDto(user);
    }

    public async Task<UserDto?> ToggleUserActiveAsync(int userId)
    {
        var user = await _db.Users.Include(u => u.UserRole).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();
        return MapUserToDto(user);
    }

    public async Task<List<RolePermissionDto>> GetMyPermissionsAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.UserRole)
            .ThenInclude(r => r!.Permissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user?.UserRole == null) return [];

        return user.UserRole.Permissions
            .Select(p => new RolePermissionDto(p.Module, p.CanView, p.CanCreate, p.CanEdit, p.CanDelete))
            .ToList();
    }

    private static RoleDto MapRoleToDto(Role r) => new(
        r.Id, r.Name, r.Description, r.IsDefault, r.IsSystem,
        r.Permissions.Select(p => new RolePermissionDto(p.Module, p.CanView, p.CanCreate, p.CanEdit, p.CanDelete)).ToList()
    );

    private static UserDto MapUserToDto(User u) => new(
        u.Id, u.FullName, u.Email, u.Department, u.Level,
        u.RoleId, u.UserRole?.Name, u.IsActive, u.CreatedAt
    );
}
