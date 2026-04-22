using Microsoft.EntityFrameworkCore;
using SmartFix.API.Models;

namespace SmartFix.API.Data;

public static class DatabaseSeeder
{
    private static readonly string[] AllModules =
    [
        "dashboard", "service_tracker", "approvals", "maintenance",
        "reports", "status", "users", "roles"
    ];

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Roles.AnyAsync()) return;

        var roles = new List<Role>
        {
            BuildRole("SuperAdmin", "Full access to all modules", isDefault: false, isSystem: true,
                modules: AllModules, view: true, create: true, edit: true, delete: true),

            BuildRole("Admin", "Manage users, tickets, and approvals", isDefault: false, isSystem: true,
                permissions: new()
                {
                    { "dashboard",       (true,  false, false, false) },
                    { "service_tracker", (true,  true,  true,  true)  },
                    { "approvals",       (true,  true,  true,  true)  },
                    { "reports",         (true,  false, false, false) },
                    { "status",          (true,  false, false, false) },
                    { "users",           (true,  true,  true,  true)  },
                    { "roles",           (true,  false, false, false) },
                }),

            BuildRole("Support", "Handle tickets and approvals", isDefault: false, isSystem: true,
                permissions: new()
                {
                    { "dashboard",       (true,  false, false, false) },
                    { "service_tracker", (true,  true,  false, false) },
                    { "approvals",       (true,  true,  true,  false) },
                    { "reports",         (true,  false, false, false) },
                    { "status",          (true,  false, false, false) },
                }),

            BuildRole("User", "Submit and track own tickets", isDefault: true, isSystem: true,
                permissions: new()
                {
                    { "dashboard",       (true,  false, false, false) },
                    { "service_tracker", (true,  true,  false, false) },
                    { "status",          (true,  false, false, false) },
                }),
        };

        db.Roles.AddRange(roles);
        await db.SaveChangesAsync();
    }

    private static Role BuildRole(
        string name, string description, bool isDefault, bool isSystem,
        string[]? modules = null, bool view = false, bool create = false, bool edit = false, bool delete = false,
        Dictionary<string, (bool view, bool create, bool edit, bool delete)>? permissions = null)
    {
        var role = new Role
        {
            Name = name,
            Description = description,
            IsDefault = isDefault,
            IsSystem = isSystem,
        };

        if (permissions != null)
        {
            role.Permissions = permissions.Select(p => new RolePermission
            {
                Module = p.Key,
                CanView = p.Value.view,
                CanCreate = p.Value.create,
                CanEdit = p.Value.edit,
                CanDelete = p.Value.delete,
            }).ToList();
        }
        else if (modules != null)
        {
            role.Permissions = modules.Select(m => new RolePermission
            {
                Module = m,
                CanView = view,
                CanCreate = create,
                CanEdit = edit,
                CanDelete = delete,
            }).ToList();
        }

        return role;
    }
}
