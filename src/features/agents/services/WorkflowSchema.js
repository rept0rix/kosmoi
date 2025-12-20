
/**
 * WorkflowSchema.js
 * 
 * Defines the standard JSON structure for workflows exported from Kosmoi Studio.
 * Also includes utilities to transform the 'React Flow' graph into a linear/executable format.
 */

// 1. The React Flow Data Structure (Source)
// Nodes: { id, type, data: { label, type, config } }
// Edges: { id, source, target }

// 2. The Executable Workflow Structure (Target)
// {
//    id: "uuid",
//    name: "Workflow Name",
//    steps: [
//       { role: "agent-id", label: "Step Name", config: {} }
//    ]
// }

export class WorkflowTransformer {

    /**
     * Converts a Studio Graph (Nodes/Edges) into a Linear Workflow.
     * @param {Array} nodes 
     * @param {Array} edges 
     */
    static toLinearWorkflow(nodes, edges) {
        const sortedNodes = [];
        const edgesMap = new Map(); // SourceID -> TargetID

        edges.forEach(edge => {
            edgesMap.set(edge.source, edge.target);
        });

        // 1. Find the Start Node (Node with no incoming edges or specific type)
        // For now, simpler: Find the node that is NOT a target of any edge
        const targets = new Set(edges.map(e => e.target));
        let currentNode = nodes.find(n => !targets.has(n.id));

        if (!currentNode && nodes.length > 0) {
            // Fallback: Just take the first one if circular or complex
            currentNode = nodes[0];
        }

        // 2. Traverse the graph linearly
        while (currentNode) {
            sortedNodes.push(currentNode);
            const nextNodeId = edgesMap.get(currentNode.id);
            currentNode = nodes.find(n => n.id === nextNodeId);
        }

        // 3. Map to Workflow Steps
        return {
            id: `generated-${Date.now()}`,
            name: "Custom Studio Workflow",
            description: "Generated from Kosmoi Studio",
            steps: sortedNodes.map(node => {
                // Parse the 'type' from data (e.g., 'agent_tech_lead' -> 'tech-lead-agent')
                // This mapping needs to align with AgentRegistry IDs.
                let role = node.data.type || 'unknown';

                // transform 'agent_ceo' -> 'ceo-agent' schema if needed
                if (role.startsWith('agent_')) {
                    role = role.replace('agent_', '') + '-agent'; // rough heuristic
                    // Mapping corrections based on known IDs
                    if (role === 'dev-agent') role = 'tech-lead-agent';
                }

                return {
                    id: node.id,
                    role: role,
                    label: node.data.label || 'Unnamed Step',
                    config: node.data.config || {},
                    systemPrompt: node.data.systemPrompt
                };
            })
        };
    }
}
