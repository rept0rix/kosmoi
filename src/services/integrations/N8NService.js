/**
 * N8NService.js
 * 
 * Service for triggering n8n automation webhooks.
 * Handles Email and WhatsApp dispatch via n8n workflows.
 */

class N8NService {
    constructor() {
        this.emailWebhookUrl = import.meta.env.VITE_N8N_EMAIL_WEBHOOK;
        this.whatsappWebhookUrl = import.meta.env.VITE_N8N_WHATSAPP_WEBHOOK;
    }

    /**
     * Triggers an email campaign via n8n.
     * @param {Object} payload
     * @param {string} payload.to - Recipient email
     * @param {string} payload.subject - Email subject
     * @param {string} payload.body - Email HTML body
     * @param {string} [payload.campaignId] - Optional campaign tracking ID
     * @returns {Promise<boolean>}
     */
    async triggerEmail(payload) {
        if (!this.emailWebhookUrl) {
            console.warn('N8N_EMAIL_WEBHOOK not configured');
            return false;
        }

        try {
            const response = await fetch(this.emailWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'email',
                    timestamp: new Date().toISOString(),
                    ...payload
                }),
            });

            if (!response.ok) {
                throw new Error(`N8N webhook failed: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to trigger N8N email:', error);
            return false;
        }
    }

    /**
     * Triggers a WhatsApp message via n8n.
     * @param {Object} payload
     * @param {string} payload.phone - Recipient phone number (E.164 format)
     * @param {string} payload.message - Message text
     * @param {string} [payload.templateId] - Optional WhatsApp template ID
     * @returns {Promise<boolean>}
     */
    async triggerWhatsApp(payload) {
        if (!this.whatsappWebhookUrl) {
            console.warn('N8N_WHATSAPP_WEBHOOK not configured');
            return false;
        }

        try {
            const response = await fetch(this.whatsappWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'whatsapp',
                    timestamp: new Date().toISOString(),
                    ...payload
                }),
            });

            if (!response.ok) {
                throw new Error(`N8N webhook failed: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to trigger N8N WhatsApp:', error);
            return false;
        }
    }
}

export const n8nService = new N8NService();
