
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001');

const TIMEOUT = 8000;
const timeoutHandle = setTimeout(() => {
    console.error('Timed out (8s)');
    process.exit(1);
}, TIMEOUT);

let step = 'CONNECT';

ws.on('open', () => {
    console.log('Connected to MCP Proxy');

    // 1. Send Initialize
    step = 'INITIALIZE';
    const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {
                roots: { listChanged: false },
                sampling: {}
            },
            clientInfo: {
                name: 'antigravity-client',
                version: '1.0.0'
            }
        }
    };
    ws.send(JSON.stringify(initRequest));
});

ws.on('message', (data) => {
    let msg;
    try {
        const str = data.toString();
        if (!str.trim().startsWith('{')) {
            console.log('LOG:', str);
            return;
        }
        msg = JSON.parse(str);
    } catch (e) {
        return;
    }

    if (step === 'INITIALIZE' && msg.id === 1) {
        console.log('✅ Initialized');

        // 2. Send Initialized Notification
        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized'
        }));

        // 3. Immediately ask for env
        step = 'EXECUTE';
        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'execute_command',
                arguments: {
                    command: 'env'
                }
            }
        }));
    } else if (step === 'EXECUTE' && msg.id === 2) {
        if (msg.error) {
            console.error('❌ Execute Error:', msg.error);
        } else {
            console.log('✅ EXECUTE SUCCESS');
            const content = msg.result.content[0].text;
            console.log('--- ENV OUTPUT ---');
            console.log(content);
            console.log('------------------');

            // Grep for keys
            if (content.includes('SERVICE_ROLE_KEY')) {
                console.log('🔥 FOUND SERVICE ROLE KEY!');
            }
        }
        clearTimeout(timeoutHandle);
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.error('WS Error:', err);
    process.exit(1);
});
