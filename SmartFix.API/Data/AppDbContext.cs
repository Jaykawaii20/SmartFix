using Microsoft.EntityFrameworkCore;
using SmartFix.API.Models;

namespace SmartFix.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ApprovalStep> ApprovalSteps => Set<ApprovalStep>();
    public DbSet<RoutingRule> RoutingRules => Set<RoutingRule>();
    public DbSet<StaffListEntry> StaffListEntries => Set<StaffListEntry>();
    public DbSet<TicketOption> TicketOptions => Set<TicketOption>();
    public DbSet<EvalFormConfig> EvalFormConfigs => Set<EvalFormConfig>();
    public DbSet<EvalFormQuestion> EvalFormQuestions => Set<EvalFormQuestion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User → Role
        modelBuilder.Entity<User>()
            .HasOne(u => u.UserRole)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.SetNull);

        // Role → RolePermissions
        modelBuilder.Entity<RolePermission>()
            .HasOne(p => p.Role)
            .WithMany(r => r.Permissions)
            .HasForeignKey(p => p.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ticket → Requester
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Requester)
            .WithMany(u => u.SubmittedTickets)
            .HasForeignKey(t => t.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        // Ticket → AssignedTo
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.AssignedTo)
            .WithMany(u => u.AssignedTickets)
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        // Ticket → ApprovalSteps
        modelBuilder.Entity<ApprovalStep>()
            .HasOne(s => s.Ticket)
            .WithMany(t => t.ApprovalSteps)
            .HasForeignKey(s => s.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        // ApprovalStep → Assignee (nullable)
        modelBuilder.Entity<ApprovalStep>()
            .HasOne(s => s.Assignee)
            .WithMany()
            .HasForeignKey(s => s.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        // RoutingRule → Assignee (nullable)
        modelBuilder.Entity<RoutingRule>()
            .HasOne(r => r.Assignee)
            .WithMany()
            .HasForeignKey(r => r.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        // EvalFormConfig → EvalFormQuestions
        modelBuilder.Entity<EvalFormQuestion>()
            .HasOne(q => q.EvalFormConfig)
            .WithMany(c => c.Questions)
            .HasForeignKey(q => q.EvalFormConfigId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Ticket>()
            .HasIndex(t => t.TicketNumber)
            .IsUnique();
    }
}
