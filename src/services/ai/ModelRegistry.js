
/**
 * Model Registry
 * Central source of truth for AI Models and Providers.
 */

export const AI_PROVIDERS = {
    GOOGLE: 'google',
    GROQ: 'groq'
};

export const AI_MODELS = {
    // --- GOOGLE GEMINI ---
    GEMINI_2_FLASH_EXP: {
        id: 'gemini-2.0-flash-exp',
        provider: AI_PROVIDERS.GOOGLE,
        tier: 'fast',
        contextWindow: 1000000,
        description: 'Fastest Google model, experimental 2.0'
    },
    GEMINI_1_5_PRO: {
        id: 'gemini-1.5-pro',
        provider: AI_PROVIDERS.GOOGLE,
        tier: 'smart',
        contextWindow: 2000000,
        description: 'High intelligence, large context'
    },
    GEMINI_3_PRO_PREVIEW: {
        id: 'gemini-3-pro-preview', // Legacy string from codebase, mapping to Google
        provider: AI_PROVIDERS.GOOGLE,
        tier: 'smart',
        description: 'Legacy placeholder'
    },

    // --- GROQ ---
    LLAMA_3_3_70B_VERSATILE: {
        id: 'llama-3.3-70b-versatile',
        provider: AI_PROVIDERS.GROQ,
        tier: 'smart',
        contextWindow: 32768,
        description: 'Meta Llama 3.3 70B via Groq'
    },
    LLAMA_3_1_8B_INSTANT: {
        id: 'llama-3.1-8b-instant',
        provider: AI_PROVIDERS.GROQ,
        tier: 'fast',
        contextWindow: 8192,
        description: 'Meta Llama 3.1 8B via Groq'
    },
    MIXTRAL_8X7B_32768: {
        id: 'mixtral-8x7b-32768',
        provider: AI_PROVIDERS.GROQ,
        tier: 'fast',
        contextWindow: 32768,
        description: 'Mixtral 8x7B via Groq'
    }
};

/**
 * Returns the model configuration for a given model ID.
 * @param {string} modelId 
 * @returns {Object|null}
 */
export const getModelConfig = (modelId) => {
    const modelKey = Object.keys(AI_MODELS).find(key => AI_MODELS[key].id === modelId);
    if (modelKey) {
        return AI_MODELS[modelKey];
    }

    // Fallback detection if ID isn't explicitly in registry but matches patterns
    if (modelId.includes('llama') || modelId.includes('mixtral') || modelId.includes('gemma')) {
        return {
            id: modelId,
            provider: AI_PROVIDERS.GROQ,
            tier: 'unknown'
        };
    }

    // Default to Google if unknown
    return {
        id: modelId,
        provider: AI_PROVIDERS.GOOGLE,
        tier: 'unknown'
    };
};
