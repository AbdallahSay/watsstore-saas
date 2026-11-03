namespace WatsStore.Api.Infrastructure.Email
{
    /// <summary>
    /// Abstraction for sending transactional emails.
    /// </summary>
    public interface IEmailSender
    {
        /// <summary>
        /// Sends a transactional email.
        /// </summary>
        /// <param name="toEmail">Recipient email address.</param>
        /// <param name="toName">Recipient display name.</param>
        /// <param name="subject">Email subject line.</param>
        /// <param name="htmlBody">HTML message body.</param>
        /// <param name="plainText">Optional plain-text fallback body.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        Task SendAsync(
            string toEmail,
            string toName,
            string subject,
            string htmlBody,
            string? plainText = null,
            CancellationToken cancellationToken = default);
    }
}
