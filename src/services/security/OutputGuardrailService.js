/**
 * OutputGuardrailService.js
 * The "Exit Visa" of the Kosmoi Immune System.
 * Sanitizes Agent output to prevent data exfiltration.
 */
export const OutputGuardrailService = {
    
    PATTERNS: {
        // Credit Cards: Matches 16 digits, with optional spaces or dashes
        // e.g., 1234-5678-1234-5678 or 1234567812345678
        CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,

        // API Keys (General Heuristics)
        // OpenAI sk- keys
        OPENAI_KEY: /\bsk-[a-zA-Z0-9]{32,}\b/g,
        // JWT Tokens (ey...)
        JWT_TOKEN: /\bey[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
        // Generic "Key-like" strings (high entropy, alphanumeric, long) - risky false positives, keeping simple for now
        
        // Emails
        EMAIL: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
    },

    /**
     * Sanitizes the text by redacting sensitive information.
     * @param {string} text 
     * @returns {string} Sanitized text
     */
    sanitize(text) {
        if (!text || typeof text !== 'string') return text;

        let sanitized = text;

        // 1. Redact API Keys
        sanitized = sanitized.replace(this.PATTERNS.OPENAI_KEY, '[API_KEY_REDACTED]');
        sanitized = sanitized.replace(this.PATTERNS.JWT_TOKEN, '[JWT_REDACTED]');

        // 2. Redact Credit Cards
        sanitized = sanitized.replace(this.PATTERNS.CREDIT_CARD, '[CREDIT_CARD_REDACTED]');

        // 3. Redact Emails (Optional context: maybe allow some? For now, strict)
        // sanitized = sanitized.replace(this.PATTERNS.EMAIL, '[EMAIL_REDACTED]'); 
        // Commented out email because it might be legitimate for CRM agents.
        // We focus on Creds/Finance for now.

        return sanitized;
    }
};
