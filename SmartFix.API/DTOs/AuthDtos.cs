namespace SmartFix.API.DTOs;

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Department,
    string Role = "Employee"
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    string FullName,
    string Email,
    string Role,
    string Department,
    string Level,
    int UserId
);
