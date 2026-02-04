
import { ToolRegistry } from "../ToolRegistry.js";
import TelegramBot from 'node-telegram-bot-api';

// specific tools for Node environment (Worker)
console.log("Loading NodeCommunicationTools...");

const getBotToken = () => process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

ToolRegistry.register(
    "create_telegram_invite",
    "Create an invite link for a Telegram group or channel.",
    {
        chatId: "string (Required) - The Chat ID of the group/channel",
        name: "string (Optional) - Name for the invite link (e.g. 'Campaign A')",
        limit: "number (Optional) - Max number of uses"
    },
    async (payload) => {
        const token = getBotToken();
        if (!token) return "[Error] No Telegram Bot Token found.";

        try {
            const bot = new TelegramBot(token, { polling: false });
            // createChatInviteLink(chatId, [options])
            const options = {};
            if (payload.name) options.name = payload.name;
            if (payload.limit) options.member_limit = payload.limit;

            const invite = await bot.createChatInviteLink(payload.chatId, options);
            return JSON.stringify({
                link: invite.invite_link,
                name: invite.name,
                creator: invite.creator,
                is_revoked: invite.is_revoked
            });
        } catch (e) {
            return `[Error] Failed to create invite link: ${e.message}`;
        }
    }
);

ToolRegistry.register(
    "read_telegram_updates",
    "Read recent messages from the bot's updates (last 24h or limit).",
    {
        limit: "number (Optional) - Number of messages to retrieve (default 10)",
        chatId: "string (Optional) - Filter by specific Chat ID"
    },
    async (payload) => {
        const token = getBotToken();
        if (!token) return "[Error] No Telegram Bot Token found.";

        try {
            const bot = new TelegramBot(token, { polling: false });
            // getUpdates([options])
            const updates = await bot.getUpdates({ limit: payload.limit || 20 });

            // Format for the agent
            const messages = updates
                .filter(u => u.message) // only messages
                .map(u => u.message)
                .filter(m => !payload.chatId || String(m.chat.id) === String(payload.chatId))
                .map(m => ({
                    sender: m.from.username || m.from.first_name,
                    text: m.text,
                    date: new Date(m.date * 1000).toISOString(),
                    chat_id: m.chat.id
                }));

            if (messages.length === 0) return "No recent messages found.";
            return JSON.stringify(messages);
        } catch (e) {
            return `[Error] Failed to read updates: ${e.message}`;
        }
    }
);

ToolRegistry.register(
    "telegram_get_chat_member",
    "Get information about a member in a chat.",
    {
        chatId: "string (Required)",
        userId: "string (Required) - Telegram User ID"
    },
    async (payload) => {
        const token = getBotToken();
        if (!token) return "[Error] No Telegram Bot Token found.";
        try {
            const bot = new TelegramBot(token, { polling: false });
            const member = await bot.getChatMember(payload.chatId, payload.userId);
            return JSON.stringify(member);
        } catch (e) {
            return `[Error] Failed to get member info: ${e.message}`;
        }
    }
);
