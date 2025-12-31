/**
 * 👻 Ghost Protocol Runner
 * Run this on your secondary machine to manage background tasks.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TASKS = {
    'crawler-restaurants': 'npm run cron:crawler -- --category=restaurants',
    'crawler-hotels': 'npm run cron:crawler -- --category=hotels',
    'content-batch': 'node scripts/tools/generate_batch_content.js',
    'monitor': 'node scripts/monitor_system.js'
};

function runTask(taskName) {
    console.log(`👻 [GHOST] Starting Task: ${taskName}...`);

    if (!TASKS[taskName]) {
        console.error(`❌ Unknown task: ${taskName}`);
        return;
    }

    const [cmd, ...args] = TASKS[taskName].split(' ');

    const child = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true,
        cwd: path.join(__dirname, '..')
    });

    child.on('close', (code) => {
        console.log(`👻 [GHOST] Task ${taskName} finished with code ${code}`);
    });
}

// Simple CLI args
const taskArg = process.argv[2];
if (taskArg) {
    runTask(taskArg);
} else {
    console.log("👻 Usage: node ghost_protocol.js <task-name>");
    console.log("Available Tasks:", Object.keys(TASKS).join(', '));
}
