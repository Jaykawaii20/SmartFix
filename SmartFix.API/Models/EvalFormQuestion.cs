namespace SmartFix.API.Models;

public class EvalFormQuestion
{
    public int Id { get; set; }
    public int EvalFormConfigId { get; set; }
    public EvalFormConfig EvalFormConfig { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = "Rating"; // Rating, Yes/No, Text
    public int DisplayOrder { get; set; }
}
