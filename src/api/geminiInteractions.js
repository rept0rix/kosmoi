import { GoogleGenAI } from '@google/genai';

/**
 * Initializes the Gemini Interactions Client.
 * Uses the same API key logic as existing integration.
 */
const getClient = () => {
    const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) ||
        (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY);

    if (!apiKey) {
        throw new Error("API_KEY_MISSING: Please configure VITE_GEMINI_API_KEY");
    }

    return new GoogleGenAI({ apiKey });
};

/**
 * Calls the Gemini Interactions API with Structured Output.
 * @param {Object} params
 * @param {string} params.model - The model to use (e.g., 'gemini-2.0-flash').
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.system_instruction] - System instructions.
 * @param {Object} [params.jsonSchema] - Optional JSON schema to enforce output.
 * @returns {Promise<Object>} The parsed JSON response.
 */
export const callAgentInteraction = async ({ model, prompt, system_instruction, jsonSchema }) => {
    try {
        const client = getClient();

        const generateConfig = {
            model: model || 'gemini-2.0-flash-exp', // Default to stable 2.0 exp
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                systemInstruction: { parts: [{ text: system_instruction }] },
            }
        };

        // Re-enable JSON mode if requested, as generateContent supports it
        if (jsonSchema) {
            generateConfig.config.responseMimeType = 'application/json';
            generateConfig.config.responseSchema = jsonSchema;
        }

        console.log("DEBUG: Calling generateContent with config:", JSON.stringify(generateConfig, null, 2));

        // Retry Loop for 429 errors
        let response;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await client.models.generateContent(generateConfig);
                break; // Success
            } catch (err) {
                if (err.status === 429 || err.code === 429 || (err.message && err.message.includes('429'))) {
                    console.warn(`⚠️ Gemini Rate Limit Exceeded (Attempt ${attempt + 1}/3). Waiting 65s...`);
                    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds
                    continue;
                }
                throw err; // Other errors throw immediately
            }
        }

        if (!response) {
            throw new Error("Gemini API Request Failed after retries.");
        }

        console.log("DEBUG: Gemini GenerateContent Response:", JSON.stringify(response, null, 2));

        const candidate = response.candidates?.[0];
        const outputText = candidate?.content?.parts?.[0]?.text;

        if (!outputText) {
            throw new Error("No text output received from Gemini Candidate.");
        }

        // Output object structure to match existing downstream logic
        const output = { text: outputText };

        // If schema was provided, the SDK should guarantee JSON, but we still parse it.
        // The new SDK might return a parsed object if we used response_format, 
        // OR a text string fitting the schema. Reading docs implies it returns text that validates.
        try {
            return JSON.parse(output.text);
        } catch (e) {
            // Try to extract JSON from markdown
            const jsonMatch = output.text.match(/```json\s*([\s\S]*?)\s*```/) || output.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch (e2) {
                    console.warn("Failed to parse extracted JSON:", e2);
                }
            }
            // Fallback: Return the text wrapped in an object if no JSON found
            console.warn("Failed to parse JSON from structured output, returning raw text wrapper.");
            return { message: output.text, raw: true };
        }

    } catch (error) {
        console.error("Gemini Interaction Error:", error);
        // If it's a 429 that bubbled up, ensure we don't crash the worker loop instantly
        if (error.status === 429 || error.code === 429) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Extra safety delay
        }
        throw error;
    }
};
