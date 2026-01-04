import { ToolRegistry } from "../ToolRegistry.js";
import { SendEmail, SendTelegram } from "../../../api/integrations.js";
import { sendWhatsApp } from "../../../api/manyPi.js";

ToolRegistry.register(
    "send_email",
    "Send a transactional email to a user.",
    {
        to: "string (Required) - Recipient email address",
        subject: "string (Required) - Email subject",
        html: "string (Required) - HTML content of the email"
    },
    async (payload) => {
        try {
            const result = await SendEmail(payload);
            if (result.error) return `[Error] Failed to send email: ${result.error}`;
            if (result.simulated) return `[System] Email simulated (No API Key): ${payload.subject}`;
            return `[System] Email sent successfully! ID: ${result.id}`;
        } catch (e) {
            return `[Error] Email failed: ${e.message}`;
        }
    });

ToolRegistry.register(
    "send_telegram",
    "Send a telegram message to a specific chat ID.",
    {
        message: "string (Required) - Message text",
        chatId: "string (Required) - Telegram Chat ID"
    },
    async (payload) => {
        return await SendTelegram({
            message: payload.message,
            chatId: payload.chatId
        });
    });

ToolRegistry.register(
    "notify_admin",
    "Send a notification to the system admin via Telegram.",
    {
        message: "string (Required) - The update or alert message for the admin"
    },
    async (payload) => {
        try {
            await SendTelegram({ message: `[Admin Notification] ${payload.message}` });
            return `[System] Admin notified via Telegram.`;
        } catch (e) {
            return `[Error] Failed to notify admin: ${e.message}`;
        }
    });

ToolRegistry.register(
    "send_whatsapp_message",
    "Send a WhatsApp message to a user.",
    {
        phone: "string (Required) - E.164 phone number",
        message: "string (Required) - Message content"
    },
    async (payload) => {
        // payload: { phone, message }
        try {
            const result = await sendWhatsApp(payload.phone, payload.message);
            return `[System] WhatsApp sent successfully! Response: ${JSON.stringify(result)}`;
        } catch (e) {
            return `[Error] WhatsApp failed: ${e.message}`;
        }
    });

ToolRegistry.register(
    "send_n8n_email",
    "Send an automated email campaign via n8n webhook.",
    {
        to: "string (Required) - Recipient email",
        subject: "string (Required) - Email Subject",
        body: "string (Required) - HTML/Text Body",
        campaignId: "string (Optional) - Tracking ID"
    },
    async (payload) => {
        const { SendN8NEmail } = await import("../../../api/integrations.js");
        try {
            const success = await SendN8NEmail(payload);
            return success
                ? `[System] Email dispatch request sent to n8n.`
                : `[Error] Failed to trigger email via n8n.`;
        } catch (e) {
            return `[Error] Email dispatch failed: ${e.message}`;
        }
    }
);

ToolRegistry.register(
    "send_n8n_whatsapp",
    "Send a WhatsApp message via n8n webhook.",
    {
        phone: "string (Required) - E.164 format",
        message: "string (Required) - Message text",
        templateId: "string (Optional)"
    },
    async (payload) => {
        const { SendN8NWhatsApp } = await import("../../../api/integrations.js");
        try {
            const success = await SendN8NWhatsApp(payload);
            return success
                ? `[System] WhatsApp dispatch request sent to n8n.`
                : `[Error] Failed to trigger WhatsApp via n8n.`;
        } catch (e) {
            return `[Error] WhatsApp dispatch failed: ${e.message}`;
        }
    }
);
