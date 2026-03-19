using System.Net;
using System.Net.Mail;

namespace LoyaltyApi.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var smtpHost = _config["Smtp:Host"] ?? "localhost";
            var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
            var smtpUser = _config["Smtp:Username"] ?? "";
            var smtpPass = _config["Smtp:Password"] ?? "";
            var fromEmail = _config["Smtp:From"] ?? "noreply@loyalty.com";

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var message = new MailMessage(fromEmail, toEmail, subject, body);
            await client.SendMailAsync(message);

            _logger.LogInformation("Email sent to {Email}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            return false;
        }
    }
}
