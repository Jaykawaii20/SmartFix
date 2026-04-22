namespace SmartFix.API.DTOs;

public record RolePermissionDto(
    string Module,
    bool CanView,
    bool CanCreate,
    bool CanEdit,
    bool CanDelete
);

public record RoleDto(
    int Id,
    string Name,
    string Description,
    bool IsDefault,
    bool IsSystem,
    List<RolePermissionDto> Permissions
);

public record CreateRoleRequest(
    string Name,
    string Description,
    List<RolePermissionDto> Permissions
);

public record UpdateRoleRequest(
    string Name,
    string Description,
    List<RolePermissionDto> Permissions
);

public record UserDto(
    int Id,
    string FullName,
    string Email,
    string Department,
    string Level,
    int? RoleId,
    string? RoleName,
    bool IsActive,
    DateTime CreatedAt
);

public record UpdateUserRoleRequest(int RoleId);
