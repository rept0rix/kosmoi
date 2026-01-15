
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agents = [
    { name: 'Island Crawler', script: 'island_crawler.js' },
    { name: 'Sales Coordinator', script: 'sales_coordinator.js' },
    { name: 'Manager', script: 'manager.js' }
];

console.log("🚀 Starting Cortex Mesh (Local)...");

const startAgent = (agent) => {
    const scriptPath = path.join(__dirname, agent.script);
    console.log(`🔌 Launching ${agent.name}...`);

    const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        env: process.env
    });

    child.on('error', (err) => {
        console.error(`❌ ${agent.name} Failed to start:`, err);
    });

    child.on('exit', (code) => {
        console.log(`⚠️ ${agent.name} exited with code ${code}`);
        if (code !== 0) {
            console.log(`🔄 Restarting ${agent.name} in 5 seconds...`);
            setTimeout(() => startAgent(agent), 5000);
        } else {
            console.log(`🛑 ${agent.name} stopped gracefully (code 0). Not restarting.`);
        }
    });
};

agents.forEach(agent => {
    startAgent(agent);
});

console.log("✅ All Agents Deployed locally with Auto-Restart.");

