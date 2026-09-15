using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;

namespace SafetyAlwaysWatch.Application.Validators.HazardousZones;

public class CreateHazardousZoneDtoValidator : AbstractValidator<CreateHazardousZoneDto>
{
    public CreateHazardousZoneDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RelativeX).InclusiveBetween(0.0, 1.0);
        RuleFor(x => x.RelativeY).InclusiveBetween(0.0, 1.0);
        RuleFor(x => x.RelativeWidth).InclusiveBetween(0.0, 1.0).GreaterThan(0);
        RuleFor(x => x.RelativeHeight).InclusiveBetween(0.0, 1.0).GreaterThan(0);
        RuleFor(x => x.RelativeX + x.RelativeWidth).LessThanOrEqualTo(1.0)
            .WithMessage("Width exceeds camera view bounds.");
        RuleFor(x => x.RelativeY + x.RelativeHeight).LessThanOrEqualTo(1.0)
            .WithMessage("Height exceeds camera view bounds.");
    }
}

public class UpdateHazardousZoneDtoValidator : AbstractValidator<UpdateHazardousZoneDto>
{
    public UpdateHazardousZoneDtoValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RelativeX).InclusiveBetween(0.0, 1.0);
        RuleFor(x => x.RelativeY).InclusiveBetween(0.0, 1.0);
        RuleFor(x => x.RelativeWidth).InclusiveBetween(0.0, 1.0).GreaterThan(0);
        RuleFor(x => x.RelativeHeight).InclusiveBetween(0.0, 1.0).GreaterThan(0);
        RuleFor(x => x.RelativeX + x.RelativeWidth).LessThanOrEqualTo(1.0)
            .WithMessage("Width exceeds camera view bounds.");
        RuleFor(x => x.RelativeY + x.RelativeHeight).LessThanOrEqualTo(1.0)
            .WithMessage("Height exceeds camera view bounds.");
    }
}

public class GetHazardousZonesQueryValidator : AbstractValidator<GetHazardousZonesQuery>
{
    public GetHazardousZonesQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
