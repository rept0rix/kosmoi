
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const INSTRUCTION_FILE = path.join(process.cwd(), 'agent_comm/instructions.md');
const STATUS_FILE = path.join(process.cwd(), 'agent_comm/status.md');

console.log("🧠 Cortex Listener: Watching for instructions in", INSTRUCTION_FILE);

/**
 * Execute a command based on instruction text
 */
async function executeCommand(instruction) {
    const timestamp = new Date().toISOString();
    let command = null;
    let args = [];

    // Simple parser (Can be upgraded to LLM later)
    const lower = instruction.toLowerCase();

    if (lower.includes('sales')) {
        command = 'node';
        args = ['scripts/sales_coordinator.js'];
    } else if (lower.includes('crawler')) {
        command = 'node';
        args = ['scripts/island_crawler.js'];
    } else {
        updateStatus(`❓ Unknown command received at ${timestamp}: "${instruction.slice(0, 50)}..."`);
        return;
    }

    updateStatus(`🚀 Executing: ${command} ${args.join(' ')}...`);

    const child = spawn(command, args, { stdio: 'pipe' });
    let output = '';

    child.stdout.on('data', (data) => {
        output += data.toString();
    });

    child.stderr.on('data', (data) => {
        output += `[ERROR] ${data.toString()}`;
    });

    child.on('close', (code) => {
        const result = code === 0 ? '✅ Success' : '❌ Failed';
        updateStatus(`Finished ${command} at ${new Date().toISOString()}:\n${result}\n\nLogs:\n${output.slice(-500)}`); // Last 500 chars
    });
}

function updateStatus(message) {
    const content = `# Status Log\n\n${message}\n\n---\nLast Updated: ${new Date().toISOString()}`;
    fs.writeFileSync(STATUS_FILE, content);
    console.log(message);
}

// Initial status
updateStatus("🟢 Link Established. Waiting for instructions...");

// Watcher
let isProcessing = false;
fs.watchFile(INSTRUCTION_FILE, { interval: 1000 }, async (curr, prev) => {
    if (isProcessing) return;
    if (curr.mtime <= prev.mtime) return;

    isProcessing = true;
    try {
        const instruction = fs.readFileSync(INSTRUCTION_FILE, 'utf8');
        if (instruction.trim().length > 0 && !instruction.includes('# Agent Instructions')) {
            console.log("\n📬 New Instruction Received!");
            await executeCommand(instruction);
        }
    } catch (e) {
        console.error("Reader error:", e);
    } finally {
        isProcessing = false;
    }
});
