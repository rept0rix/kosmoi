import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CORTEX_ROOT = path.resolve(__dirname, '../../cortex');
const AGENTS_ROOT = path.join(CORTEX_ROOT, 'agents');

class AgentProtocol {
    constructor(agentName) {
        this.agentName = agentName;
        this.agentRoot = path.join(AGENTS_ROOT, agentName);
        this.inboxPath = path.join(this.agentRoot, 'inbox');
        this.outboxPath = path.join(this.agentRoot, 'outbox');
        this.statusPath = path.join(this.agentRoot, 'status.json');

        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.inboxPath, this.outboxPath].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
    }

    /**
     * Update the agent's status file.
     * @param {string} status - e.g., 'IDLE', 'BUSY', 'ERROR'
     * @param {string} currentTask - Description of what the agent is doing.
     * @param {object} metadata - Any extra data.
     */
    updateStatus(status, currentTask, metadata = {}) {
        const payload = {
            agent: this.agentName,
            status: status,
            current_task: currentTask,
            last_heartbeat: new Date().toISOString(),
            metadata: metadata
        };
        fs.writeFileSync(this.statusPath, JSON.stringify(payload, null, 2));
    }

    /**
     * Send a message to another agent.
     * @param {string} toAgent - Name of the recipient agent (e.g., 'sales_coordinator').
     * @param {string} type - Message type (e.g., 'lead_handoff').
     * @param {string} content - Markdown or Text content.
     * @param {object} meta - Extra headers.
     */
    sendMessage(toAgent, type, content, meta = {}) {
        const recipientInbox = path.join(AGENTS_ROOT, toAgent, 'inbox');

        if (!fs.existsSync(recipientInbox)) {
            console.error(`UNKNOWN RECIPIENT: ${toAgent}`);
            return false;
        }

        const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const frontmatter = `---
id: "${msgId}"
from: "${this.agentName}"
to: "${toAgent}"
type: "${type}"
status: "unread"
timestamp: "${timestamp}"
priority: "${meta.priority || 'normal'}"
---
`;
        const fileContent = frontmatter + content;

        // Write to recipient's inbox
        fs.writeFileSync(path.join(recipientInbox, `${msgId}.md`), fileContent);
        console.log(`[Protocol 626] Sent message ${msgId} to ${toAgent}`);
        return true;
    }

    /**
     * Read and parse messages from the Inbox.
     * @returns {Array} - List of message objects { id, from, type, content, filePath }.
     */
    readInbox() {
        const files = fs.readdirSync(this.inboxPath).filter(f => f.endsWith('.md'));
        const messages = [];

        for (const file of files) {
            const filePath = path.join(this.inboxPath, file);
            const raw = fs.readFileSync(filePath, 'utf-8');

            // Simple Frontmatter Parser
            const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (match) {
                const yamlRaw = match[1];
                const content = match[2];

                const meta = {};
                yamlRaw.split('\n').forEach(line => {
                    const [key, ...val] = line.split(':');
                    if (key && val) meta[key.trim()] = val.join(':').trim().replace(/"/g, '');
                });

                messages.push({ ...meta, content: content.trim(), filePath });
            }
        }
        return messages; // Returns all messages (processed and unprocessed)
    }

    /**
     * Mark a message as processed (move to archive or delete).
     * For now, we move to a '_processed' folder in the inbox or simple delete if requested.
     * Implementing DELETE for efficiency for now.
     */
    archiveMessage(filePath) {
        // Option A: Delete
        fs.unlinkSync(filePath);
        // Option B: Move to 'archive' (Optional improvement)
    }
}

export default AgentProtocol;
