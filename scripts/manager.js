
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import AgentProtocol from './lib/agent_protocol.js';

const protocol = new AgentProtocol('manager');

// Configuration
const THRESHOLD_PAUSE = 10; // Pause crawler if Sales has > 10 processed messages
const THRESHOLD_RESUME = 2;  // Resume crawler if Sales has < 2 messages

async function run_manager_cycle() {
    console.log("👁️ Manager ('Overseer') Online.");
    protocol.updateStatus('ACTIVE', 'Monitoring Swarm Health');

    while (true) {
        try {
            // 1. Check Sales Coordinator Health/Load
            const salesInboxPath = path.resolve('cortex/agents/sales_coordinator/inbox');
            let salesQueueSize = 0;

            if (fs.existsSync(salesInboxPath)) {
                salesQueueSize = fs.readdirSync(salesInboxPath).filter(f => f.endsWith('.md')).length;
            }

            console.log(`📊 Status - Sales Queue: ${salesQueueSize}`);

            // 2. Traffic Control Logic
            if (salesQueueSize >= THRESHOLD_PAUSE) {
                console.log("⚠️ Congestion Detected. Throttling Crawler...");
                protocol.sendMessage('island_crawler', 'STOP_CRAWLING', `
Reason: Sales Queue Congestion (${salesQueueSize} items).
Action: Pause scouting until further notice.
                `, { priority: 'critical' });

                protocol.updateStatus('INTERVENTION', 'Pausing Crawler (Congestion)');
            }
            else if (salesQueueSize <= THRESHOLD_RESUME) {
                // We could send RESUME if we had implemented a "PAUSED" state in crawler specifically
                // For now, the crawler just stops on STOP command. 
                // We would need to implement a 'RESUME' command in crawler or just let it restart.
                // Current crawler implementation exits on STOP. So the Runner would need to restart it.
                // Let's just log for now.
                // console.log("✅ Network Clear.");
                protocol.updateStatus('ACTIVE', 'Monitoring (Network Healthy)');
            }

            // 3. Global Directive Check (Future)
            // const directive = fs.readFileSync('cortex/global_directive.md', 'utf-8');

        } catch (error) {
            console.error("Manager Error:", error);
        }

        // Pulse every 10 seconds
        await new Promise(r => setTimeout(r, 10000));
    }
}

run_manager_cycle();
