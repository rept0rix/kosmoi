import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3001';

console.log(`Connecting to ${WS_URL}...`);
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('Connected!');

    // 1. Initialize
    const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" }
        }
    };
    console.log('Sending Initialize...');
    ws.send(JSON.stringify(initRequest));
});

ws.on('message', (data) => {
    console.log('Received:', data.toString());
    const response = JSON.parse(data);

    if (response.id === 1) {
        console.log('Initialized! Sending initialized notification...');
        ws.send(JSON.stringify({
            jsonrpc: "2.0",
            method: "notifications/initialized"
        }));

        console.log('Sending tools/call for execute_command...');
        ws.send(JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "execute_command",
                arguments: { command: "ls", args: ["-la"] }
            }
        }));
    } else if (response.id === 2) {
        console.log('Tool Call Result:', JSON.stringify(response, null, 2));
        ws.close();
    }
});

ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
});

ws.on('close', () => {
    console.log('Disconnected');
});
