namespace SmartFix.API.Models;

// Singleton – only one row (Id = 1)
public class EvalFormConfig
{
    public int Id { get; set; }
    public string Title { get; set; } = "IT Service Evaluation";
    public string IntroMessage { get; set; } = "Thank you for using SmartFix IT.";
    public ICollection<EvalFormQuestion> Questions { get; set; } = new List<EvalFormQuestion>();
}
