
import Groq from "groq-sdk";

/**
 * Initializes the Groq Client.
 */
const getClient = () => {
    const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('groq_api_key') : null) ||
        (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : process.env.VITE_GROQ_API_KEY);

    if (!apiKey) {
        throw new Error("API_KEY_MISSING: Please configure VITE_GROQ_API_KEY");
    }

    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

/**
 * Calls the Groq API.
 * @param {Object} params
 * @param {string} params.model - The model to use (e.g., 'llama3-70b-8192').
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.system_instruction] - System instructions.
 * @param {Object} [params.jsonSchema] - Optional JSON schema to enforce output.
 * @returns {Promise<Object>} The parsed JSON response.
 */
export const callGroqInteraction = async ({ model, prompt, system_instruction, jsonSchema }) => {
    try {
        const client = getClient();

        const messages = [];
        if (system_instruction) {
            messages.push({ role: "system", content: system_instruction });
        }
        messages.push({ role: "user", content: prompt });

        const completionConfig = {
            messages: messages,
            model: model || "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 32768,
            top_p: 1,
            stream: false,
        };

        if (jsonSchema) {
            completionConfig.response_format = { type: "json_object" };
        }

        console.log("DEBUG: Calling Groq with config:", JSON.stringify(completionConfig, null, 2));

        const chatCompletion = await client.chat.completions.create(completionConfig);

        const content = chatCompletion.choices[0]?.message?.content || "";

        try {
            // If we requested JSON, try to parse it. 
            // Groq with JSON mode usually returns valid JSON.
            if (jsonSchema || content.trim().startsWith('{')) {
                return JSON.parse(content);
            }
            return { message: content };
        } catch (e) {
            console.warn("Failed to parse Groq response as JSON:", e);
            return { message: content, raw: true };
        }

    } catch (error) {
        console.error("Groq Interaction Error:", error);
        if (error.status === 429) {
            // Simple wait if rate limited (though typically we should just failover or queue)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        throw error;
    }
};
