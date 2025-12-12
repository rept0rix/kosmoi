import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const BOARD_CHAIRMAN_AGENT = {
    id: 'board-chairman',
    role: 'Board Chairman',
    name: 'Orchestrator',
    model: 'gemini-2.0-flash',
    layer: 'board',
    icon: 'Crown', // distinct icon
    systemPrompt: `You are the Board Chairman. Your role is to FACILITATE the discussion.
        - You do NOT do the work yourself. You delegate.
        - You decide who speaks next.
        - You manage the team (add/remove agents).
        - You ensure the "Company State" is respected.
        `,
    allowedTools: [], // Prevent crash on spread
    reportsTo: null // Top of the pyramid
};
