import { ToolRegistry } from "../ToolRegistry.js";
import { SendEmail, SendTelegram } from "../../../api/integrations.js";

ToolRegistry.register("send_email", async (payload) => {
    try {
        const result = await SendEmail(payload);
        if (result.error) return `[Error] Failed to send email: ${result.error}`;
        if (result.simulated) return `[System] Email simulated (No API Key): ${payload.subject}`;
        return `[System] Email sent successfully! ID: ${result.id}`;
    } catch (e) {
        return `[Error] Email failed: ${e.message}`;
    }
});

ToolRegistry.register("send_telegram", async (payload) => {
    return await SendTelegram({
        message: payload.message,
        chatId: payload.chatId
    });
});

ToolRegistry.register("notify_admin", async (payload) => {
    try {
        await SendTelegram({ message: `[Admin Notification] ${payload.message}` });
        return `[System] Admin notified via Telegram.`;
    } catch (e) {
        return `[Error] Failed to notify admin: ${e.message}`;
    }
});
