/**
 * EmailService
 * Handles sending emails via external providers (Simulated for now).
 * 
 * Future Integration:
 * - Resend
 * - SendGrid
 * - Nodemailer (SMTP)
 */
export const EmailService = {
    /**
     * Send an email.
     * @param {Object} params
     * @param {string} params.to
     * @param {string} params.subject
     * @param {string} params.body
     * @returns {Promise<{success: boolean, messageId: string, timestamp: string}>}
     */
    send: async ({ to, subject, body }) => {
        console.log(`[EmailService] Sending email to ${to}...`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate success
        console.log(`[EmailService] Email SENT!`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`BODY: \n${body}`);

        return {
            success: true,
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
    }
};
