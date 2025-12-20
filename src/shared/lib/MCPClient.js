/**
 * MCP Client Helper (Optimized Singleton)
 * Manages persistent WebSocket connection to local MCP Proxy.
 */
export const MCPClient = {
    ws: null,
    isConnected: false,
    pendingRequests: new Map(),
    nextMessageId: 1,
    reconnectTimer: null,
    connectPromise: null,

    /**
     * Initialize connection if not active.
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.isConnected) return;
        if (this.connectPromise) return this.connectPromise;

        this.connectPromise = new Promise((resolve, reject) => {
            console.log("[MCP Client] Connecting...");
            this.ws = new WebSocket('ws://localhost:3001');

            this.ws.onopen = () => {
                console.log("[MCP Client] Connected.");
                this.isConnected = true;
                this.reconnectTimer = null;

                // Send Initialize
                this.sendInternal({
                    method: "initialize",
                    params: {
                        protocolVersion: "2024-11-05",
                        capabilities: {},
                        clientInfo: { name: "samui-client", version: "1.0.0" }
                    }
                }).then(() => {
                    // Send Notif
                    this.ws.send(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
                    resolve();
                }).catch(err => {
                    console.error("[MCP Client] Init Failed:", err);
                    reject(err);
                });
            };

            this.ws.onmessage = (event) => this.handleMessage(event);

            this.ws.onerror = (err) => {
                console.error("[MCP Client] Connection Error:", err);
                if (!this.isConnected) reject(err); // Reject initial connect
            };

            this.ws.onclose = () => {
                console.log("[MCP Client] Disconnected.");
                this.isConnected = false;
                this.connectPromise = null;
                // Auto-reconnect if it was an unexpected close?
                // For now, next callTool will try to reconnect.
            };
        });

        return this.connectPromise;
    },

    handleMessage(event) {
        try {
            const response = JSON.parse(event.data);

            // Handle Responses to pending requests
            if (response.id && this.pendingRequests.has(response.id)) {
                const { resolve, reject, timer } = this.pendingRequests.get(response.id);
                clearTimeout(timer);
                this.pendingRequests.delete(response.id);

                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            } else {
                // Handle Notifications or Logs from Server?
                console.log("[MCP Client] RX:", response);
            }
        } catch (e) {
            console.error("[MCP Client] Parse Error:", e);
        }
    },

    sendInternal(payload) {
        return new Promise((resolve, reject) => {
            const id = this.nextMessageId++;
            const json = JSON.stringify({ jsonrpc: "2.0", id, ...payload });

            // Timeout safety
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error("Timeout waiting for MCP response"));
                }
            }, 30000); // 30s timeout

            this.pendingRequests.set(id, { resolve, reject, timer });
            this.ws.send(json);
        });
    },

    /**
     * Call a tool on the MCP Server.
     * @param {string} toolName 
     * @param {Object} args 
     * @returns {Promise<string>}
     */
    async callTool(toolName, args) {
        try {
            await this.connect();

            const result = await this.sendInternal({
                method: "tools/call",
                params: {
                    name: toolName,
                    arguments: args
                }
            });

            // Parse common content format
            if (result && result.content && Array.isArray(result.content)) {
                return result.content.map(c => c.text).join('\n');
            }

            return JSON.stringify(result);

        } catch (e) {
            return `[Error] MCP Tool '${toolName}' failed: ${e.message}`;
        }
    }
};
