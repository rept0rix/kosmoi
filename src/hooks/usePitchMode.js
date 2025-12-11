import { useState } from 'react';
import { predictCategory } from '@/utils/categoryRouter';
import { db } from '@/api/supabaseClient';
import { getAgentReply } from '@/services/agents/AgentBrain';
import { getAgentById } from '@/services/agents/AgentRegistry';
import { Bot } from 'lucide-react';

/**
 * Hook to handle "Sellers Pitch" mode logic.
 * Detects intent in user messages and triggers dynamic AI pitches from service providers.
 */
export const usePitchMode = ({ addMessage }) => {
    const [isPitching, setIsPitching] = useState(false);

    const handleMessage = async (text) => {
        const category = await predictCategory(text);
        if (!category) return;

        // Intent Detected! Trigger Pitch Mode
        console.log(`[PitchMode] Intent detected: ${category}`);
        setIsPitching(true);

        try {
            // 1. Fetch top 3 providers for this category
            const { data: providers, error } = await db.from('service_providers')
                .select('*')
                .eq('category', category)
                .eq('status', 'active')
                .order('average_rating', { ascending: false })
                .limit(3);

            if (error) throw error;

            if (!providers || providers.length === 0) {
                console.log('[PitchMode] No providers found.');
                return;
            }

            // 2. Announce
            setTimeout(() => {
                addMessage({
                    id: Date.now().toString(),
                    role: 'system',
                    content: `🎯 **Smart Match**: I found ${providers.length} top-rated ${category.replace('_', ' ')} specialists for you. Let's hear their pitches!`,
                    timestamp: new Date().toISOString()
                });
            }, 500);

            // 3. Generate Pitches (Parallel generation, sequential display)
            // We want to simulate them typing/responding.

            for (let i = 0; i < providers.length; i++) {
                const provider = providers[i];
                // Stagger requests slightly or just wait for generation
                setTimeout(async () => {
                    try {
                        // Construct the prompt as a "System Context" for this specific generation
                        // We trick the agent by passing this as the conversation history
                        const simulatedHistory = [
                            {
                                role: 'system',
                                content: `
                                    CONTEXT:
                                    You are acting as: ${provider.business_name}
                                    Service Category: ${provider.category}
                                    Rating: ${provider.average_rating} stars (${provider.total_reviews} reviews)
                                    Location: ${provider.location}
                                    Description: ${provider.description}
                                `
                            },
                            {
                                role: 'user',
                                content: `I need help with this: "${text}". Write me a short, 1-2 sentence pitch explaining why I should choose you. Be persuasive and professional.`
                            }
                        ];

                        // We need the full agent object
                        const salesAgent = getAgentById('sales-pitch-agent');
                        if (!salesAgent) throw new Error("Sales Pitch Agent not found!");

                        const aiResponse = await getAgentReply(salesAgent, simulatedHistory, {});

                        addMessage({
                            id: `pitch-${provider.id}`,
                            role: 'assistant',
                            agentId: 'sales-pitch-agent', // Used for identification
                            sender: provider.business_name,
                            avatar: provider.images?.[0] || null,
                            content: aiResponse.message, // property is .message, not .reply
                            isPitch: true, // Marker for UI styling
                            providerId: provider.id,
                            timestamp: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error("Failed to generate pitch for", provider.business_name, err);
                    }
                }, 2000 + (i * 3000)); // Stagger by 3 seconds
            }

        } catch (err) {
            console.error('[PitchMode] Error:', err);
        } finally {
            // We set pitching to false quickly so we don't block other interactions, 
            // even though the timeouts are pending.
            setTimeout(() => setIsPitching(false), 1000);
        }
    };

    return {
        handleMessage,
        isPitching
    };
};
