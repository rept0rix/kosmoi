import axios from 'axios';

/**
 * Service for interacting with Xiaomi Mimo V2 Flash API.
 * Provides OpenAI-compatible chat completion.
 */
export class MimoService {
    constructor() {
        this.baseUrl = 'https://api.xiaomimimo.com/v1';
        this.model = 'mimo-v2-flash';
    }

    /**
     * Get the API key from environment variables.
     * Checks Vite's import.meta.env and Node's process.env.
     */
    getApiKey() {
        // Try Vite env first, then Node env
        const key = import.meta.env?.VITE_MIMO_API_KEY ||
            (typeof globalThis !== 'undefined' && globalThis.process?.env ? (globalThis.process.env.MIMO_API_KEY || globalThis.process.env.VITE_MIMO_API_KEY) : null);

        if (!key) {
            console.warn("MIMO_API_KEY not found in environment variables");
        }
        return key;
    }

    /**
     * Generate text completion using Mimo V2 Flash.
     * @param {string} prompt - The user prompt
     * @param {string} systemPrompt - Optional system instruction
     * @param {number} temperature - Creativity (0.0 - 1.0)
     * @returns {Promise<string>} - The generated text
     */
    async generateText(prompt, systemPrompt = "You are a helpful assistant.", temperature = 0.7) {
        const apiKey = this.getApiKey();

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages,
                    temperature,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error("Invalid response format from Mimo API");
            }

        } catch (error) {
            console.error("MimoService Error:", error.response?.data || error.message);
            throw new Error(`Mimo API Failed: ${error.message} `);
        }
    }
}

// Singleton instance
export const mimoService = new MimoService();
