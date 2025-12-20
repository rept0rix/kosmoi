import { ToolRegistry } from "../ToolRegistry.js";
import { saveFileToSupabase, listFilesFromSupabase } from "@/features/agents/services/memorySupabase.js";

ToolRegistry.register("notepad", async (payload, options) => {
    // payload: { filename, content } or just content string if legacy
    // options: { userId, agentId }
    const filename = payload.filename || `note_${Date.now()}.md`;
    const content = payload.content || payload;
    const { userId, agentId } = options;

    if (userId) {
        await saveFileToSupabase(filename, content, agentId, userId);
        return `[System] File '${filename}' saved successfully to Server Storage.`;
    } else {
        return `[System] Warning: You are not logged in. File '${filename}' was NOT saved to the server.`;
    }
});

ToolRegistry.register("doc-writer", async (payload, options) => {
    // Alias for notepad
    return ToolRegistry.execute("notepad", payload, options);
});

ToolRegistry.register("file-explorer", async (payload, options) => {
    const { userId } = options;
    if (userId) {
        const remoteFiles = await listFilesFromSupabase(userId);
        const remotePaths = remoteFiles.map(f => f.path);
        return `[System] Current files (Server): ${remotePaths.join(', ')}`;
    } else {
        return `[System] (No files - Login required)`;
    }
});

ToolRegistry.register("spreadsheet", async () => {
    return "Simulated spreadsheet: Textual table instead of Excel.";
});

ToolRegistry.register("crm", async () => {
    return "Simulated CRM: Interaction logged with customer.";
});
