using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SafetyAlwaysWatch.Api.Middlewares;
using SafetyAlwaysWatch.Api.Services;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Interfaces;
using SafetyAlwaysWatch.Infrastructure.Persistence;
using SafetyAlwaysWatch.Infrastructure.Persistence.Interceptors;
using SafetyAlwaysWatch.Infrastructure.Persistence.Repositories;
using Serilog;
using FluentValidation;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Application.Validators;
using SafetyAlwaysWatch.Application.Validators.Employees;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.DTOs.Auth;
using SafetyAlwaysWatch.Infrastructure.Security;
using System.Reflection;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;
using SafetyAlwaysWatch.Application.Validators.HazardousZones;


var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();

// Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ??
                       Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

builder.Services.AddScoped<AuditInterceptor>();

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseNpgsql(connectionString);
    options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
});

// Configure Dependency Injection
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<IScoreResetService, ScoreResetService>();
builder.Services.AddHostedService<SafetyAlwaysWatch.Api.Services.ScoreResetBackgroundService>();
builder.Services.AddSingleton<IMockSimulationControl, MockSimulationControl>();
builder.Services.AddHostedService<MockInferenceSimulatorService>();
builder.Services.AddScoped<IFaceRecognitionService, SafetyAlwaysWatch.Infrastructure.Services.FaceRecognitionService>();
builder.Services.AddScoped<IZoneComplianceEvaluator, SafetyAlwaysWatch.Infrastructure.Services.DummyZoneComplianceEvaluator>();
builder.Services.AddHttpClient<ITelegramEscalationService, SafetyAlwaysWatch.Infrastructure.Services.TelegramEscalationService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ITrackIdentityCache>(sp => new SafetyAlwaysWatch.Infrastructure.Services.TrackIdentityCache(sp.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>(), TimeSpan.FromMinutes(5)));
builder.Services.AddScoped<IIdentityResolverService, SafetyAlwaysWatch.Application.Services.IdentityResolverService>();
builder.Services.AddScoped<IInferenceIngestionService, SafetyAlwaysWatch.Application.Services.InferenceIngestionService>();
builder.Services.AddScoped<IInferenceResultPublisher, SafetyAlwaysWatch.Api.Services.SignalRInferenceResultPublisher>();

builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddMaps(typeof(SafetyAlwaysWatch.Application.Mappings.EmployeeProfile).Assembly);
});

builder.Services.AddScoped<IValidator<GetEmployeesQuery>, GetEmployeesQueryValidator>();
builder.Services.AddScoped<IValidator<CreateEmployeeDto>, CreateEmployeeDtoValidator>();
builder.Services.AddScoped<IValidator<LoginRequestDto>, LoginRequestValidator>();
builder.Services.AddScoped<IValidator<ChangePasswordRequestDto>, ChangePasswordRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateEmployeeDto>, UpdateEmployeeDtoValidator>();
builder.Services.AddScoped<IHazardousZoneService, HazardousZoneService>();
builder.Services.AddScoped<IValidator<CreateHazardousZoneDto>, CreateHazardousZoneDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateHazardousZoneDto>, UpdateHazardousZoneDtoValidator>();
builder.Services.AddScoped<IValidator<GetHazardousZonesQuery>, GetHazardousZonesQueryValidator>();
builder.Services.AddScoped<IValidator<SafetyAlwaysWatch.Application.DTOs.Requests.ResetScoreRequest>, ResetScoreRequestValidator>();


// Configure JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "super_secret_key_for_development_purposes_only_12345!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "SAW_Issuer",
            ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "SAW_Audience",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Safety Always Watch API", Version = "v1" });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // SignalR requires specific origin logic or SetIsOriginAllowed
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // SignalR requires credentials
    });
});

builder.Services.AddSignalR();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<SafetyAlwaysWatch.Api.Hubs.MonitoringHub>("/hubs/monitoring");

app.Run();
