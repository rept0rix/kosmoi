/**
 * Kosmoi Agent Worker Launcher
 * Starts the agent worker process + a minimal HTTP health check server.
 * Used for cloud deployment (Railway, Render, etc.)
 */
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 8080;

// ─── Health Check HTTP Server ─────────────────────────────────────────────────
let workerStatus = 'starting';
let workerPid = null;
let startTime = new Date().toISOString();
let restartCount = 0;

const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: workerStatus,
            pid: workerPid,
            uptime: process.uptime(),
            started: startTime,
            restarts: restartCount,
            service: 'kosmoi-agent-worker'
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`[Launcher] Health server listening on port ${PORT}`);
});

// ─── Worker Process Management ────────────────────────────────────────────────
function startWorker() {
    console.log(`[Launcher] Starting agent worker (restart #${restartCount})...`);
    workerStatus = 'running';

    const worker = spawn('node', ['scripts/agent_worker.js'], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        env: { ...process.env }
    });

    workerPid = worker.pid;
    console.log(`[Launcher] Worker started with PID: ${workerPid}`);

    worker.on('exit', (code, signal) => {
        console.error(`[Launcher] Worker exited with code ${code}, signal ${signal}`);
        workerStatus = 'restarting';
        restartCount++;

        // Auto-restart after 5 seconds (prevents rapid crash loops)
        setTimeout(() => {
            console.log('[Launcher] Restarting worker...');
            startWorker();
        }, 5000);
    });

    worker.on('error', (err) => {
        console.error('[Launcher] Worker process error:', err.message);
        workerStatus = 'error';
    });
}

// Start the worker
startWorker();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Launcher] SIGTERM received, shutting down...');
    workerStatus = 'shutting_down';
    server.close();
    process.exit(0);
});
