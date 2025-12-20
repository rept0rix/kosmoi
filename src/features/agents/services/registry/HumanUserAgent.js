export const HUMAN_USER_AGENT = {
    id: 'human-user',
    role: 'You (The Boss)',
    name: 'Human',
    model: 'Human Intelligence',
    layer: 'board',
    icon: 'User',
    systemPrompt: "You are the owner. You decide the vision.",
    allowedTools: ["approve", "reject", "guide"],
    reportsTo: null
};
