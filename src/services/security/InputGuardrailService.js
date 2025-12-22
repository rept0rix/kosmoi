/**
 * InputGuardrailService.js
 * The "Skin" of the Kosmoi Immune System.
 * Deterministic validation of user inputs before they reach any Agent Logic.
 */
export const InputGuardrailService = {
    // Configuration
    MAX_LENGTH: 10000, // Characters
    
    // Known Jailbreak Patterns (Regex)
    // "i" flag for case-insensitive
    DENY_PATTERNS: [
        /ignore previous instructions/i,
        /ignore all previous instructions/i,
        /system override/i,
        /you are now a/i, // Roleplay override
        /simulated mode/i,
        /developer mode/i,
        /unfiltered/i,
        /jailbreak/i
    ],

    // Common Homoglyphs (Simple mapping for high-risk chars)
    HOMOGLYPHS: {
        'о': 'o', 'с': 'c', 'е': 'e', 'х': 'x', 'і': 'i', 'ј': 'j', 'а': 'a', 'р': 'p', // Cyrillic
        'ο': 'o', 'ι': 'i', 'α': 'a', 'ν': 'v' // Greek (examples)
        // Add more as discovered
    },

    /**
     * Main Validation Entry Point
     * @param {string} input - The raw user input
     * @returns {Object} result - { isValid: boolean, reason: string | null, sanitized: string }
     */
    validateInput(input) {
        if (!input || typeof input !== 'string') {
            return { isValid: false, reason: "Invalid input format", sanitized: "" };
        }

        // 1. Length Check (DoS Protection)
        if (input.length > this.MAX_LENGTH) {
            return { 
                isValid: false, 
                reason: `Input exceeds maximum length (${input.length}/${this.MAX_LENGTH})`, 
                sanitized: input.slice(0, this.MAX_LENGTH) 
            };
        }

        // 2. Normalization (Unicode Safety)
        // NFKD helps with accents (é -> e), coupled with manual homoglyphs
        let normalized = input.normalize('NFKD');
        
        // 2.1 Manual Homoglyph Sanitzation
        normalized = normalized.split('').map(char => this.HOMOGLYPHS[char] || char).join('');

        // 3. Prompt Injection Check
        for (const pattern of this.DENY_PATTERNS) {
            if (pattern.test(normalized)) {
                return {
                    isValid: false,
                    reason: `Security Violation: Restricted phrase detected via input guardrail.`,
                    sanitized: normalized // In a strict mode, we might redact, but usually we reject.
                };
            }
        }

        return {
            isValid: true,
            reason: null,
            sanitized: normalized
        };
    }
};
