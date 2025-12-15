import { LoggerService } from '../LoggerService';
import { supabase } from '@/lib/instance';
import { agents } from '../agents/AgentRegistry';

/**
 * CoreLoop.js - The "BabyAGI" Engine of Kosmoi.
 * 
 * This service is responsible for the "Thinking Loop" that runs independently of user input.
 * It checks for:
 * 1. Open High-Priority Tasks
 * 2. Documentation Gaps (Self-Maintenance)
 * 3. Idle Agents (Resource Optimization)
 */

export const CoreLoop = {
    isRunning: false,
    intervalId: null,
    tickRate: 10000, // 10 seconds

    start: () => {
        if (CoreLoop.isRunning) return;

        LoggerService.logSystemEvent('CORE_LOOP', 'STARTUP', { message: "Autonomous Engine Started" });
        CoreLoop.isRunning = true;

        CoreLoop.intervalId = setInterval(async () => {
            await CoreLoop.tick();
        }, CoreLoop.tickRate);
    },

    stop: () => {
        if (CoreLoop.intervalId) clearInterval(CoreLoop.intervalId);
        CoreLoop.isRunning = false;
        LoggerService.logSystemEvent('CORE_LOOP', 'SHUTDOWN', { message: "Autonomous Engine Stopped" });
    },

    tick: async () => {
        try {
            console.log("🧠 Brain Tick..."); // Visible in console for verification
            LoggerService.logSystemEvent('CORE_LOOP', 'TICK_START');

            // 1. Check for Unassigned High Priority Tasks
            const { data: openTasks } = await supabase
                .from('agent_tasks')
                .select('*')
                .eq('status', 'open')
                .eq('priority', 'high')
                .is('assigned_to', null)
                .limit(1);

            if (openTasks && openTasks.length > 0) {
                const task = openTasks[0];
                await CoreLoop.assignTask(task);
                return; // One major action per tick
            }

            // 2. Check "Company Health" (Mock for now, will integrate CompanyHeartbeat later)
            // Example: If documentation is missing, create a task
            // await CoreLoop.checkHealth();

            // 3. Idle / Growth Mode
            // If nothing else, log heartbeat
            LoggerService.logSystemEvent('CORE_LOOP', 'TICK_IDLE', { message: "No immediate actions required." });

        } catch (error) {
            console.error("Brain Error:", error);
            LoggerService.logSystemEvent('CORE_LOOP', 'ERROR', { error: error.message });
        }
    },

    assignTask: async (task) => {
        LoggerService.logSystemEvent('CORE_LOOP', 'DECISION', {
            thought: `Found unassigned high-priority task: ${task.title}. Looking for suitable agent.`
        });

        // Simple heuristic: Find Tech Lead for code, Product for planning
        // In v2: Use a Vector Search to match agent skills
        let assignedAgent = 'ceo-agent'; // Default fallback
        if (task.title.toLowerCase().includes('code') || task.title.toLowerCase().includes('bug')) {
            assignedAgent = 'tech-lead-agent';
        } else if (task.title.toLowerCase().includes('design')) {
            assignedAgent = 'ux-designer-agent';
        }

        // Assign logic
        const { error } = await supabase
            .from('agent_tasks')
            .update({ assigned_to: assignedAgent, status: 'in_progress' })
            .eq('id', task.id);

        if (!error) {
            LoggerService.logSystemEvent('CORE_LOOP', 'ACTION', {
                action: 'ASSIGN_TASK',
                taskId: task.id,
                agentId: assignedAgent
            });
            console.log(`🧠 Brain Assigned Task ${task.id} to ${assignedAgent}`);

            // Trigger Agent Wakeup dynamically
            const { AgentService } = await import('../agents/AgentService.js');
            await AgentService.wakeUp(assignedAgent);
        }
    }
};
