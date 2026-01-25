import TelegramBot from 'node-telegram-bot-api';

// Placeholder for the token - will be replaced by environment variable or user input
const getEnvVar = (key) => {
    return import.meta.env?.[key] || import.meta.env?.[`VITE_${key}`] ||
        (typeof globalThis !== 'undefined' && globalThis.process?.env ? (globalThis.process.env[key] || globalThis.process.env[`VITE_${key}`]) : null);
};

const token = getEnvVar('TELEGRAM_BOT_TOKEN') || 'YOUR_TELEGRAM_BOT_TOKEN';

// We only create the bot instance if we have a token (or for dev structure)
// In production/worker, this should crash or warn if no token.
let bot = null;

try {
    if (token && token !== 'YOUR_TELEGRAM_BOT_TOKEN') {
        bot = new TelegramBot(token, { polling: false }); // We only send messages, no polling needed for now
        console.log("Telegram Bot Service Initialized.");
    } else {
        console.warn("Telegram Token missing. Notifications will be logged to console only.");
    }
} catch (error) {
    console.error("Failed to initialize Telegram Bot:", error);
}

export const sendTelegramNotification = async (message) => {
    if (!bot) {
        console.log(`[Telegram Mock] ${message}`);
        return { success: false, error: "No token" };
    }

    try {
        // We need a chat ID. For now, the user needs to start the bot and we need to capture their ID.
        // Or we ask the user for their Chat ID too?
        // Easier: The user sends /start, and we capture the ID. 
        // But for "Push" notifications, we need a hardcoded Chat ID or a way to store it.

        // For this MVP: We will assume a hardcoded Admin Chat ID or Env Var.
        const chatId = getEnvVar('TELEGRAM_CHAT_ID') || "7224939578";

        if (!chatId) {
            console.log(`[Telegram Mock - Missing ChatID] ${message}`);
            return { success: false, error: "No Chat ID" };
        }

        await bot.sendMessage(chatId, message);
        return { success: true };
    } catch (error) {
        console.error("Telegram Send Error:", error);
        return { success: false, error: error.message };
    }
};

// Function to handle incoming updates (if we switch to polling/webhook later)
export const handleTelegramUpdate = async (update) => {
    // Logic to handle new commands like /start to save Chat ID
};
