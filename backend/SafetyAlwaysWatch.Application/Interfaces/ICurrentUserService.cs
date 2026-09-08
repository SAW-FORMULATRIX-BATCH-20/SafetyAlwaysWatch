namespace SafetyAlwaysWatch.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
}
