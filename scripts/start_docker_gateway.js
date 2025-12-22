import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROXY_PATH = path.resolve(__dirname, '../mcp-proxy.js');

console.log('🚀 Starting MCP Proxy in DOCKER GATEWAY Mode...');

const proxy = spawn('node', [PROXY_PATH], {
    stdio: 'inherit',
    env: { ...process.env, MCP_GATEWAY_MODE: 'true' }
});

proxy.on('close', (code) => {
    console.log(`Proxy exited with code ${code}`);
});
