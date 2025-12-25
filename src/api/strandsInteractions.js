/**
 * Interactions with the AWS Strands Agent Backend Service
 */

const STRANDS_API_URL = "http://localhost:8000";

/**
 * Calls the Strands Agent chat endpoint.
 * @param {Object} params
 * @param {string} params.prompt - The user's message
 * @param {string} params.model - The model ID (optional, handled by backend)
 * @returns {Promise<Object>} - The JSON response from the agent
 */
export async function callStrandsInteraction({ prompt }) {
    try {
        const response = await fetch(`${STRANDS_API_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: prompt }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Strands Backend Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Normalize response to match expected AgentBrain format
        // Backend returns { "response": "string response" } or similiar
        // We need to parse it if it's a JSON string, or just return it as message

        let parsedResponse = {};
        try {
            // Strands often returns a string. If it's a JSON string, parse it.
            // If the agent is instructed to return JSON, it might be in data.response
            if (typeof data.response === 'string') {
                // Check if it looks like JSON
                if (data.response.trim().startsWith('{')) {
                    parsedResponse = JSON.parse(data.response);
                } else {
                    parsedResponse = { message: data.response };
                }
            } else {
                parsedResponse = data;
            }
        } catch (e) {
            parsedResponse = { message: data.response || "No response content" };
        }

        // Ensure strict format for AgentBrain
        return {
            thought_process: parsedResponse.thought_process || "Processed by Strands Video Agent",
            message: parsedResponse.message || parsedResponse.response || "I processed your video request.",
            action: parsedResponse.action || null
        };

    } catch (error) {
        console.error("Strands Interaction Failed:", error);
        throw error;
    }
}
