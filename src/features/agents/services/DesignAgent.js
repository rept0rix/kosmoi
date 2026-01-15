import { callGroqInteraction } from '../../../api/groqInteractions.js';
import { callAgentInteraction } from '../../../api/geminiInteractions.js';

// Structured Output Schema for React Flow
const DESIGN_SCHEMA = {
    type: "object",
    properties: {
        thought_process: { type: "string" },
        nodes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    type: { type: "string", enum: ["live-screen", "shape", "text"] },
                    position: {
                        type: "object",
                        properties: { x: { type: "number" }, y: { type: "number" } },
                        required: ["x", "y"]
                    },
                    data: {
                        type: "object",
                        properties: {
                            screenId: { type: "string" },
                            label: { type: "string" },
                            type: { type: "string" }, // For shape type
                            text: { type: "string" },
                            color: { type: "string" }
                        }
                    }
                },
                required: ["id", "type", "position", "data"]
            }
        },
        edges: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    source: { type: "string" },
                    target: { type: "string" },
                    animated: { type: "boolean" },
                    label: { type: "string" }
                },
                required: ["id", "source", "target"]
            }
        }
    },
    required: ["nodes", "edges"]
};

export const DesignAgent = {
    /**
     * Generates a layout based on the user prompt and current nodes.
     */
    async generateLayout(prompt, currentNodes = []) {
        const systemPrompt = `
      You are an Expert UI Designer for a React Flow canvas.
      Your goal is to generate a JSON structure of Nodes and Edges based on the user's description.
      
      AVAILABLE NODE TYPES:
      1. 'live-screen': Real application pages. 
         - data.screenId options: ['dashboard', 'login', 'vendor-signup', 'provider-dashboard', 'business-registration', 'business-dashboard']
      2. 'shape': Visual grouping.
         - data.type options: ['rectangle', 'circle']
         - data.label: Optional text label.
         - data.color: Hex color.
      3. 'text': Text annotations.
         - data.text: The content.

      LAYOUT RULES:
      - Place nodes logically.
      - Do not overlap nodes if possible (live-screens are approx 400x600px).
      - Connect relevant flows with edges.
      
      CURRENT CANVAS CONTEXT:
      ${JSON.stringify(currentNodes.map(n => ({ id: n.id, type: n.type, pos: n.position })))}
    `;

        try {
            // Prefer Groq for speed if available, otherwise Gemini
            const response = await callGroqInteraction({
                model: 'llama-3.3-70b-versatile', // Fast & Smart
                prompt: `USER REQUEST: "${prompt}"`,
                system_instruction: systemPrompt,
                jsonSchema: DESIGN_SCHEMA
            });

            return response;
        } catch (error) {
            console.warn("Groq failed, trying Gemini...", error);
            // Fallback to Gemini if Groq fails
            return await callAgentInteraction({
                model: 'gemini-1.5-flash',
                prompt: `USER REQUEST: "${prompt}"`,
                // Gemini might not support strict JSON schema in the same way depending on implementation, 
                // but we ask for JSON in the prompt.
                system_instruction: systemPrompt + "\n RESPONSE MUST BE VALID JSON matching the schema: { nodes: [], edges: [] }",
            });
        }
    }
};
