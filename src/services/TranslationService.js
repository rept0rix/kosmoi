
import { AgentService } from "./agents/AgentService";

/**
 * TranslationService
 * Handles real-time translation of chat messages.
 * Uses the 'translator-agent' (or a direct LLM call) to translate text.
 */
export const TranslationService = {

    /**
     * Detects if the text is Hebrew (or non-English).
     * Simple heuristic: checks for Hebrew characters.
     */
    detectLanguage: (text) => {
        if (!text) return 'en';
        const hebrewPattern = /[\u0590-\u05FF]/;
        return hebrewPattern.test(text) ? 'he' : 'en';
    },

    /**
     * Translates text to the target language.
     * @param {string} text - Text to translate
     * @param {string} targetLang - 'en' or 'he'
     * @returns {Promise<string>}
     */
    translate: async (text, targetLang) => {
        if (!text) return "";

        // If target is same as source (heuristically), return original
        const detected = TranslationService.detectLanguage(text);
        if (detected === targetLang) return text;

        try {
            // We use a lightweight LLM call or the translator agent for this.
            // For now, let's construct a direct prompt via AgentService logic 
            // (assuming we can reuse the brain or just a raw completion)

            // SYSTEM PROMPT FOR TRANSLATION
            const prompt = `
            You are a professional translator. 
            Translate the following text to ${targetLang === 'he' ? 'Hebrew' : 'English'}.
            Unceasingly preserve the tone and specific terminology (like "Agent", "Board").
            Return ONLY the translated text, no preamble.
            
            Text: "${text}"
            `;

            // Note: This requires AgentService to expose a generic completion method 
            // or we use a dedicated "Translator" instance.
            // For this MVP, we will assume AgentService has a 'tools' or 'brain' we can leverage,
            // or we simply instantiate a temporary "Translator" to do the job.

            // Let's use a mock for immediate UI feedback if API is not strictly wired,
            // but effectively we want to call the LLM.

            // *Implementation Note*: in a real app, this should call an external API (Google/DeepL) 
            // or a fast LLM endpoint to avoid context overhead. 
            // We will simulate the async nature here or hook into the existing LLM service if accessible.

            // We use the lower-level InvokeLLM to avoid circular dependencies with AgentService
            // and to avoid needing to instantiate a full agent for a simple translation.
            const { InvokeLLM } = await import('../api/integrations.js');

            const response = await InvokeLLM({
                prompt: prompt,
                system_instruction: 'You are a precise translator. Output only the translated text.',
                model: 'gemini-exp-1206', // Fast model
            });

            return response.text.trim().replace(/^"|"$/g, ''); // Clean quotes

        } catch (error) {
            console.error("Translation failed:", error);
            return text; // Fallback to original
        }
    }
};
