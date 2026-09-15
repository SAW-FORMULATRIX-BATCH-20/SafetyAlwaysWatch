using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class TelegramEscalationService : ITelegramEscalationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelegramEscalationService> _logger;

    public TelegramEscalationService(HttpClient httpClient, IConfiguration configuration, ILogger<TelegramEscalationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendEscalationAsync(ViolationEvent violationEvent, byte[] snapshot, CancellationToken cancellationToken = default)
    {
        var botToken = _configuration["TelegramSettings:BotToken"];
        var defaultChatId = _configuration["TelegramSettings:DefaultChatId"];

        if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(defaultChatId))
        {
            _logger.LogWarning("Telegram bot token or default chat ID is not configured. Skipping snapshot delivery.");
            return false;
        }

        string url = $"https://api.telegram.org/bot{botToken}/sendPhoto";

        using var content = new MultipartFormDataContent();
        
        string caption = $"<b>Violation Confirmed!</b>\n" +
                         $"Zone ID: {violationEvent.DangerZoneId}\n" +
                         $"Employee ID: {(violationEvent.EmployeeId.HasValue ? violationEvent.EmployeeId.Value.ToString() : "Unknown")}\n" +
                         $"Time: {violationEvent.DetectedAt:yyyy-MM-dd HH:mm:ss}";

        content.Add(new StringContent(defaultChatId), "chat_id");
        content.Add(new StringContent(caption), "caption");
        content.Add(new StringContent("HTML"), "parse_mode");
        
        var imageContent = new ByteArrayContent(snapshot);
        imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        content.Add(imageContent, "photo", "snapshot.jpg");

        try
        {
            var response = await _httpClient.PostAsync(url, content, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully sent transient snapshot for ViolationEvent {ViolationEventId} to Telegram.", violationEvent.Id);
                return true;
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to send snapshot to Telegram for ViolationEvent {ViolationEventId}. Status: {StatusCode}. Error: {Error}", violationEvent.Id, response.StatusCode, error);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while sending snapshot to Telegram for ViolationEvent {ViolationEventId}.", violationEvent.Id);
            return false;
        }
    }
}
