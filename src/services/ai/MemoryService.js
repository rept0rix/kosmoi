import { supabase } from '../../api/supabaseClient.js';

/**
 * Service to manage User Long-term Memory & Profiling.
 * mirrors the core logic of GetProfile.org but uses our Supabase instance.
 */
class MemoryService {

    /**
     * Retrieves the comprehensive user profile (traits + key memories).
     * @param {string} userId
     * @returns {Promise<Object>} { traits: shorthand{}, summary: string }
     */
    async getUserProfile(userId) {
        if (!userId) return null;

        try {
            // Fetch Traits
            const { data: traits, error: traitsError } = await supabase
                .from('ai_traits')
                .select('trait_key, trait_value, confidence_score')
                .eq('user_id', userId);

            if (traitsError) throw traitsError;

            // Fetch Recent Core Memories (Facts/Preferences)
            const { data: memories, error: memoriesError } = await supabase
                .from('ai_memories')
                .select('content, memory_type')
                .eq('user_id', userId)
                .in('memory_type', ['fact', 'preference'])
                .order('created_at', { ascending: false })
                .limit(10);

            if (memoriesError) throw memoriesError;

            return {
                traits: traits || [],
                memories: memories || []
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { traits: [], memories: [] };
        }
    }

    /**
     * Constructs a System Prompt injection string based on the user's profile.
     * "GetProfile" style injection.
     * @param {string} userId 
     */
    async getSystemContext(userId) {
        const profile = await this.getUserProfile(userId);
        if (!profile || (profile.traits.length === 0 && profile.memories.length === 0)) {
            return '';
        }

        let contextString = `\n\n[USER MEMORY & PROFILE]\n`;

        // Inject Traits
        if (profile.traits.length > 0) {
            contextString += `User Traits:\n`;
            profile.traits.forEach(t => {
                contextString += `- ${t.trait_key}: ${t.trait_value}\n`;
            });
        }

        // Inject Memories
        if (profile.memories.length > 0) {
            contextString += `\nKey Memories:\n`;
            profile.memories.forEach(m => {
                contextString += `- [${m.memory_type.toUpperCase()}] ${m.content}\n`;
            });
        }

        contextString += `[END USER MEMORY]\nUse this context to personalize your responses, but do not explicitly mention that you are reading from a profile unless asked.\n\n`;

        return contextString;
    }

    /**
     * Saves a new memory or fact about the user.
     * @param {string} userId 
     * @param {string} content 
     * @param {string} type 'fact', 'preference', 'conversation_summary'
     * @param {Object} context Metadata like sentiment, topic
     */
    async addMemory(userId, content, type = 'fact', context = {}) {
        try {
            const { data, error } = await supabase
                .from('ai_memories')
                .insert({
                    user_id: userId,
                    content,
                    memory_type: type,
                    context,
                    importance_score: 0.8 // Default heavy weight for direct adds
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding memory:', error);
            throw error;
        }
    }

    /**
     * Upserts a specific user trait.
     * @param {string} userId 
     * @param {string} key 
     * @param {string} value 
     */
    async setTrait(userId, key, value) {
        try {
            const { data, error } = await supabase
                .from('ai_traits')
                .upsert({
                    user_id: userId,
                    trait_key: key,
                    trait_value: value,
                    confidence_score: 0.9
                }, { onConflict: 'user_id, trait_key' })
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error setting trait:', error);
            throw error;
        }
    }

    /**
     * Analyze input to extract potential traits/memories using LLM.
     * @param {string} userId 
     * @param {string} userMessage 
     */
    async textToMemory(userId, userMessage) {
        if (!userMessage || userMessage.length < 10) return; // Skip very short messages

        try {
            console.log('🧠 MemoryService: Analyzing input for extraction...');
            const { callGroqInteraction } = await import('@/api/groqInteractions');

            const extractionPrompt = `
Analyze the following user message for long-term memory extraction.
User Message: "${userMessage}"

Identify two types of information:
1. Traits: Durable characteristics, personality, role, or style (e.g., "Senior Developer", "Impatient", "Visual Learner").
2. Facts/Preferences: Concrete preferences or specific facts (e.g., "Uses Next.js", "Likes dark mode", "Building a CRM").

Return a JSON object with this structure:
{
  "traits": [ { "key": "string", "value": "string" } ],
  "facts": [ "string" ]
}
If nothing relevant is found, return empty arrays.
`;

            const result = await callGroqInteraction({
                model: 'llama-3.3-70b-versatile',
                prompt: extractionPrompt,
                system_instruction: "You are a backend memory extraction system. Output strictly valid JSON.",
                jsonSchema: true
            });

            console.log('🧠 MemoryService: Extraction Result:', result);

            // Save Traits
            if (result.traits && Array.isArray(result.traits)) {
                for (const trait of result.traits) {
                    await this.setTrait(userId, trait.key.toLowerCase().replace(/\s+/g, '_'), trait.value);
                }
            }

            // Save Facts as Memories
            if (result.facts && Array.isArray(result.facts)) {
                for (const fact of result.facts) {
                    await this.addMemory(userId, fact, 'fact');
                }
            }

        } catch (error) {
            console.error('🧠 MemoryService: Extraction Failed', error);
        }
    }
}

export const memoryService = new MemoryService();
