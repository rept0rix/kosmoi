
import { InvokeLLM } from '../../api/integrations.js';
import { agents } from './AgentRegistry.js';

/**
 * MagicGraph.js
 * Generates Studio Graphs from text prompts using an LLM (Gemini) or Heuristic Fallback.
 */

const getId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// Heuristic Fallback (Original Logic)
const generateHeuristicGraph = (prompt) => {
    const p = prompt.toLowerCase();
    let nodes = [];
    let edges = [];

    if (p.includes('blog') || p.includes('article') || p.includes('content') || p.includes('tweet')) {
        // CONTENT ENGINE TEMPLATE
        const researcherId = getId('node');
        const writerId = getId('node');
        const editorId = getId('node');

        nodes = [
            {
                id: researcherId,
                type: 'studioNode',
                position: { x: 100, y: 100 },
                data: { label: 'Trend Researcher', type: 'agent_dev', subLabel: 'Agent', status: 'idle', systemPrompt: 'You are an expert researcher. Find trending topics.' }
            },
            {
                id: writerId,
                type: 'studioNode',
                position: { x: 400, y: 100 },
                data: { label: 'Content Writer', type: 'agent_cmo', subLabel: 'Agent', status: 'idle', systemPrompt: 'You are a skilled copywriter. Write engaging content based on research.' }
            },
            {
                id: editorId,
                type: 'studioNode',
                position: { x: 700, y: 100 },
                data: { label: 'Chief Editor', type: 'agent_ceo', subLabel: 'Agent', status: 'idle', systemPrompt: 'Review the content for tone, grammar and style.' }
            }
        ];

        edges = [
            { id: getId('edge'), source: researcherId, target: writerId, animated: true, style: { stroke: '#6366f1' } },
            { id: getId('edge'), source: writerId, target: editorId, animated: true, style: { stroke: '#6366f1' } }
        ];

    } else if (p.includes('startup') || p.includes('business') || p.includes('launch')) {
        // STARTUP LAUNCH TEMPLATE
        const pmId = getId('node');
        const devId = getId('node');
        const designId = getId('node');

        nodes = [
            {
                id: pmId,
                type: 'studioNode',
                position: { x: 250, y: 50 },
                data: { label: 'Product Manager', type: 'agent_ceo', subLabel: 'Agent', status: 'idle', systemPrompt: 'Define the MVP specs.' }
            },
            {
                id: devId,
                type: 'studioNode',
                position: { x: 100, y: 250 },
                data: { label: 'Tech Lead', type: 'agent_dev', subLabel: 'Agent', status: 'idle', systemPrompt: 'Write the code.' }
            },
            {
                id: designId,
                type: 'studioNode',
                position: { x: 400, y: 250 },
                data: { label: 'UX Designer', type: 'agent_marketing', subLabel: 'Agent', status: 'idle', systemPrompt: 'Design the interface.' }
            }
        ];

        edges = [
            { id: getId('edge'), source: pmId, target: devId, animated: true, style: { stroke: '#6366f1' } },
            { id: getId('edge'), source: pmId, target: designId, animated: true, style: { stroke: '#6366f1' } }
        ];
    } else {
        // GENERIC / FALLBACK
        const workerId = getId('node');
        nodes = [
            {
                id: workerId,
                type: 'studioNode',
                position: { x: 250, y: 200 },
                data: { label: 'Universal Agent', type: 'agent_dev', subLabel: 'Agent', status: 'idle', systemPrompt: `You are a helpful agent. Task: ${prompt}` }
            }
        ];
    }

    return { nodes, edges };
};

export const generateGraphFromPrompt = async (prompt) => {
    console.log("Magic Graph: Detecting build strategy for...", prompt);

    try {
        // 1. Prepare available agents list for context
        const availableAgentsStub = agents.map(a => `- ${a.name} (ID: ${a.id}, Role: ${a.role})`).join('\n');

        // 2. Construct LLM Prompt
        const llmPrompt = `
You are an expert AI Architect. Your goal is to design a multi-agent workflow graph based on the user's request.

Available Agent Types:
${availableAgentsStub}

User Request: "${prompt}"

Instruction:
Generate a JSON object representing the nodes and edges for this workflow.
Structure:
{
  "nodes": [
    { "label": "Agent Name", "type": "agent_id_from_list", "systemPrompt": "Specific instructions for this agent step" }
  ],
  "edges": [
    { "from": "index_of_source_node", "to": "index_of_target_node" }
  ]
}

Rules:
1. Use ONLY the Agent IDs provided in the list for the "type" field. If unsure, use 'agent_dev' or 'agent_ceo'.
2. The "systemPrompt" should be specific to the task at hand.
3. Create a logical flow (e.g., Researcher -> Writer -> Editor).
4. Return ONLY valid JSON.
`;

        // 3. Call LLM
        const response = await InvokeLLM({
            prompt: llmPrompt,
            model: "gemini-2.0-flash", // Fast model
            system_instruction: "You are a JSON generator for a node graph tool."
        });

        // 4. Parse JSON
        let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        // 5. Transform to React Flow Graph
        const nodes = data.nodes.map((n, index) => ({
            id: getId(`node_${index}`),
            type: 'studioNode',
            position: { x: 100 + (index * 250), y: 100 + (index % 2 === 0 ? 0 : 150) }, // Simple staggered layout
            data: {
                label: n.label,
                type: n.type || 'agent_dev',
                subLabel: 'Agent',
                status: 'idle',
                systemPrompt: n.systemPrompt
            }
        }));

        // Map edges using indices
        const edges = data.edges.map(e => ({
            id: getId('edge'),
            source: nodes[e.from].id,
            target: nodes[e.to].id,
            animated: true,
            style: { stroke: '#6366f1' }
        }));

        if (nodes.length === 0) throw new Error("Empty graph generated");

        console.log("Magic Graph: LLM Generation Success");
        return { nodes, edges };

    } catch (error) {
        console.warn("Magic Graph: LLM Generation Failed, falling back to heuristics.", error);
        return generateHeuristicGraph(prompt);
    }
};
