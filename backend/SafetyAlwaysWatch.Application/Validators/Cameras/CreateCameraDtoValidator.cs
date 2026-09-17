using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Cameras;

namespace SafetyAlwaysWatch.Application.Validators.Cameras;

public class CreateCameraDtoValidator : AbstractValidator<CreateCameraDto>
{
    public CreateCameraDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Location).NotEmpty().MaximumLength(500);
        RuleFor(x => x.StreamUrl).MaximumLength(1000);
    }
}
