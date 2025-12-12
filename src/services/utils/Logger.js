/**
 * Central Logger Service for Kosmoi.
 * Stores logs in memory (for now) and exposes them for the SystemMonitor.
 * Broadcaster pattern allows UI components to subscribe to new logs.
 */
export const Logger = {
    logs: [],
    listeners: [],
    maxLogs: 1000,

    /**
     * Log an event
     * @param {'info'|'warn'|'error'|'success'} level 
     * @param {string} source - e.g. "AgentService", "Database", "Orchestrator"
     * @param {string} message 
     * @param {Object} metadata 
     */
    log(level, source, message, metadata = {}) {
        const logEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            level,
            source,
            message,
            metadata
        };

        this.logs.unshift(logEntry); // Add to beginning

        // Prune
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Notify
        this.notifyListeners(logEntry);

        // Also console log for dev
        const style = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: blue';
        console.log(`%c[${source}] ${message}`, style, metadata);
    },

    info(source, message, meta) { this.log('info', source, message, meta); },
    warn(source, message, meta) { this.log('warn', source, message, meta); },
    error(source, message, meta) { this.log('error', source, message, meta); },
    success(source, message, meta) { this.log('success', source, message, meta); },

    /**
     * Subscribe to new logs
     * @param {Function} callback 
     * @returns {Function} unsubscribe
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    notifyListeners(logEntry) {
        this.listeners.forEach(l => l(logEntry));
    },

    getLogs() {
        return this.logs;
    },

    clear() {
        this.logs = [];
        this.notifyListeners(null); // Signal clear
    }
};
