
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001');

const TIMEOUT = 5000;
const timeoutHandle = setTimeout(() => {
    console.error('Timed out waiting for response');
    process.exit(1);
}, TIMEOUT);

ws.on('open', () => {
    console.log('Connected to MCP Proxy');

    // JSON-RPC 2.0 Request to list tools
    const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list' // Standard MCP method for listing tools?
        // Actually MCP spec uses client/server capabilities. 
        // But most implementations support 'tools/list'.
        // Let's check mcp_server_supabase.js imports. It uses @modelcontextprotocol/sdk.
    };

    // The SDK server handles 'tools/list' automatically.
    ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
    const str = data.toString();
    if (!str.trim().startsWith('{')) {
        console.log('Log:', str);
        return;
    }

    try {
        const response = JSON.parse(str);
        if (response.id === 1) {
            clearTimeout(timeoutHandle);
            console.log('✅ Tools List Received:');
            console.dir(response, { depth: null });
            process.exit(0);
        }
    } catch (e) {
        console.error('Parse Error:', e);
    }
});

ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
    process.exit(1);
});
