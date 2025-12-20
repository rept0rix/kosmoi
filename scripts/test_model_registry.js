
import { getModelConfig, AI_PROVIDERS, AI_MODELS } from '../src/services/ai/ModelRegistry.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ Assertion Failed: ${message}`);
    }
    console.log(`✅ ${message}`);
}

console.log("Testing Model Registry...");

// Test 1: Known Model Constant
const config1 = getModelConfig(AI_MODELS.LLAMA_3_3_70B_VERSATILE.id);
assert(config1.provider === AI_PROVIDERS.GROQ, "Known Groq model should return GROQ provider");

// Test 2: Known Google Model
const config2 = getModelConfig(AI_MODELS.GEMINI_2_FLASH_EXP.id);
assert(config2.provider === AI_PROVIDERS.GOOGLE, "Known Gemini model should return GOOGLE provider");

// Test 3: Unknown Llama model (Dynamic Detection)
const config3 = getModelConfig("llama-3-8b-something-random");
assert(config3.provider === AI_PROVIDERS.GROQ, "Unknown string containing 'llama' should be detected as GROQ");

// Test 4: Unknown Gemini model (Default)
const config4 = getModelConfig("gemini-future-version");
assert(config4.provider === AI_PROVIDERS.GOOGLE, "Unknown model should default to GOOGLE");

console.log("\nAll registry tests passed!");
