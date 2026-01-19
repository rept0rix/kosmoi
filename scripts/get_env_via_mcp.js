
import WebSocket from 'ws';

// Connect to the local MCP proxy
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
    console.log('Connected to MCP Proxy');

    // JSON-RPC 2.0 Request to call 'execute_command' tool
    const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: 'execute_command',
            arguments: {
                command: 'env'
            }
        }
    };

    ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
    let response;
    try {
        const str = data.toString();
        // Simple heuristic: ignore if not starting with {
        if (!str.trim().startsWith('{')) {
            console.log('Received log:', str);
            return;
        }
        response = JSON.parse(str);
    } catch (e) {
        console.log('Skipping non-JSON message:', data.toString());
        return;
    }

    if (response.id === 1) {
        if (response.error) {
            console.error('Error:', response.error);
        } else {
            // The output of 'env' should be in content[0].text
            const output = response.result.content[0].text;
            console.log('--- ENV VARS FOUND ---');
            console.log(output);
            console.log('----------------------');

            // Try to extract specific keys for convenience
            const lines = output.split('\n');
            const vars = {};
            lines.forEach(line => {
                const [key, ...val] = line.split('=');
                if (key) vars[key] = val.join('=');
            });

            if (vars.VITE_SUPABASE_SERVICE_ROLE_KEY) {
                console.log('✅ FOUND: VITE_SUPABASE_SERVICE_ROLE_KEY');
            } else {
                console.log('❌ VITE_SUPABASE_SERVICE_ROLE_KEY NOT FOUND in process env');
            }
        }
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
    process.exit(1);
});
