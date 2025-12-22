import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MCP_SERVER_PATH = join(__dirname, 'mcp_server_supabase.js');
const WS_PORT = 3001;

// DETECT MODE
const USE_DOCKER_GATEWAY = process.env.MCP_GATEWAY_MODE === 'true';

console.log(`Starting MCP Proxy on port ${WS_PORT}...`);
if (USE_DOCKER_GATEWAY) {
    console.log(`🐳 Mode: DOCKER GATEWAY`);
} else {
    console.log(`🏠 Mode: LOCAL SCRIPT`);
    console.log(`Target: ${MCP_SERVER_PATH}`);
}

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Spawn the MCP server process
    const spawnCommand = USE_DOCKER_GATEWAY ? 'docker' : 'node';
    const spawnArgs = USE_DOCKER_GATEWAY 
        ? ['mcp', 'gateway', 'run'] 
        : [MCP_SERVER_PATH];
    
    // For docker, we might need shell:true or just ensure path is good.
    // We'll use shell:true for docker to be safe with environment.
    const spawnOptions = {
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: USE_DOCKER_GATEWAY
    };

    console.log(`[Proxy] Spawning: ${spawnCommand} ${spawnArgs.join(' ')}`);

    const mcpProcess = spawn(spawnCommand, spawnArgs, spawnOptions);

    mcpProcess.on('error', (err) => {
        console.error('Failed to start MCP process:', err);
        ws.close();
    });

    // Forward messages from WebSocket to MCP Process
    ws.on('message', (message) => {
        const msgString = message.toString();
        // console.log('Client -> MCP:', msgString);

        // MCP expects JSON-RPC messages separated by newlines
        mcpProcess.stdin.write(msgString + '\n');
    });

    // Forward messages from MCP Process to WebSocket
    // We need to handle potentially fragmented data or multiple messages in one chunk
    let buffer = '';
    mcpProcess.stdout.on('data', (data) => {
        buffer += data.toString();

        const lines = buffer.split('\n');
        // The last item is either an empty string (if data ended with \n) or an incomplete message
        buffer = lines.pop();

        for (const line of lines) {
            if (line.trim()) {
                // console.log('MCP -> Client:', line);
                ws.send(line);
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        mcpProcess.kill();
    });

    mcpProcess.on('close', (code) => {
        console.log(`MCP process exited with code ${code}`);
        ws.close();
    });
});

console.log('MCP Proxy is ready. Run this script with "node mcp-proxy.js"');
