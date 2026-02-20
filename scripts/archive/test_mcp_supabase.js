import { spawn } from 'child_process';
import path from 'path';

// Path to the MCP server script
const serverScript = path.resolve(process.cwd(), 'mcp_server_supabase.js');

console.log(`Starting Supabase MCP server from: ${serverScript}`);

// Spawn the server process
const server = spawn('node', [serverScript], {
    stdio: ['pipe', 'pipe', 'inherit'] // pipe stdin/stdout, inherit stderr for logs
});

let buffer = '';

server.stdout.on('data', (data) => {
    const chunk = data.toString();
    buffer += chunk;

    // JSON-RPC messages are newline delimited
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep the last partial line in the buffer

    for (const line of lines) {
        if (!line.trim()) continue;

        try {
            const message = JSON.parse(line);
            console.log('Received:', JSON.stringify(message, null, 2));

            // Handle responses
            if (message.id === 1) { // Initialize response
                console.log('Server Initialized. Sending initialized notification...');
                send({ jsonrpc: '2.0', method: 'notifications/initialized' });

                console.log('Listing tools...');
                send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
            } else if (message.id === 2) { // Tools list response
                console.log('Tools listed. Attempting to read a table...');
                // Try to read 'users' table or 'profiles' - or just any public table if we knew one.
                // Let's try to list schemas first if we updated tool name, but we have 'get_schema' and 'read_table'.
                // Let's call 'get_schema' first (id 3)
                send({
                    jsonrpc: '2.0',
                    id: 3,
                    method: 'tools/call',
                    params: { name: 'get_schema', arguments: {} }
                });
            } else if (message.id === 3) {
                console.log('Schema check complete. Now testing Management API...');
                send({
                    jsonrpc: '2.0',
                    id: 4,
                    method: 'tools/call',
                    params: {
                        name: 'request_management_api',
                        arguments: {
                            method: 'GET',
                            path: '/v1/projects'
                        }
                    }
                });
            } else if (message.id === 4) {
                console.log('Management API check complete.');
                process.exit(0);
            }

        } catch (err) {
            console.error('Error parsing JSON:', err);
        }
    }
});

// server.stderr is inherited, so we don't need to listen to it


server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});

function send(message) {
    const json = JSON.stringify(message);
    console.log('Sending:', json);
    server.stdin.write(json + '\n');
}

// 1. Initialize
console.log('Sending Initialize...');
send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
    }
});
