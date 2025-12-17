import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { BrainCircuit, Play, Pause, Zap, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext'; // Access to run ad-hoc tasks if needed
import { OptimizerLoop } from '@/services/loops/OptimizerLoop'; // We will control the loop directly
import { supabase } from '@/api/supabaseClient';

// Mock insights for initial render (until we hook up real data)
const MOCK_INSIGHTS = [
    { id: 1, type: 'optimization', title: 'Pricing Opportunity', description: 'Conversion rate is high (8%), suggesting demand elasticity. Recommend increasing "Standard Plan" price by 5%.', impact: 'High', status: 'pending', created_at: '2025-12-17T10:00:00Z' },
    { id: 2, type: 'fix', title: 'Agent Hallucination Fix', description: 'Detected repetitive loop in "Concierge Agent". Applied PROMPT_OVERRIDE_402 to strictly forbid JSON in chat.', impact: 'Medium', status: 'implemented', created_at: '2025-12-16T15:30:00Z' },
];

const AdminOptimizer = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [insights, setInsights] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync with loop state on mount
    useEffect(() => {
        setIsRunning(OptimizerLoop.isRunning);
        fetchInsights();

        // Optional: Poll for new insights every 10 seconds
        const interval = setInterval(fetchInsights, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchInsights = async () => {
        try {
            // Fetch tasks tagged as 'optimization' or 'fix' from agent_tasks
            // We look for tasks where 'tags' (jsonb/array) contains 'optimization'
            // Or simpler: filter where title starts with [Optimization] if tags aren't reliable
            // But AgentService.js sets tags: ['optimization', payload.type]

            const { data, error } = await supabase
                .from('agent_tasks')
                .select('*')
                .contains('tags', ['optimization'])
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error("Error fetching insights:", error);
                return;
            }

            if (data) {
                // Map to UI model
                const mapped = data.map(task => {
                    // Start with defaults
                    let type = 'optimization';
                    let impact = 'Unknown';
                    let description = task.description;

                    // Parse description if it contains structured text from our service
                    // Description format: "Start description...\n\nImpact: High\nSuggested Action: {...}"

                    const impactMatch = task.description.match(/Impact: (.*?)(\n|$)/);
                    if (impactMatch) impact = impactMatch[1].trim();

                    // Clean description for display (remove impact line and below?)
                    // For now, just show first 100 chars or full if short

                    // Check tags for type
                    if (task.tags && task.tags.includes('fix')) type = 'fix';

                    return {
                        id: task.id,
                        type,
                        title: task.title.replace('[Optimization] ', ''),
                        description: description,
                        impact,
                        status: task.status,
                        created_at: task.created_at
                    };
                });
                setInsights(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch insights", e);
        }
    };

    // ...
};

export default AdminOptimizer;
