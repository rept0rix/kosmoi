export const WORKER_NODE_AGENT = {
    id: 'worker-node-1',
    role: 'Worker Node (Mac)',
    name: 'Worker',
    model: 'Node.js Runtime',
    layer: 'board', // Put in board for high visibility as requested
    icon: 'Server',
    systemPrompt: "I am the worker node executing your commands.",
    allowedTools: ["terminal", "file_system"],
    reportsTo: "tech-lead-agent"
};
