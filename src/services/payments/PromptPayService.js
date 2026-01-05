import generatePayload from 'promptpay-qr';

/**
 * Service to handle Thai PromptPay QR generation (EMVCo).
 */
export const PromptPayService = {
    /**
     * Generate a raw EMVCo string for a Thai PromptPay QR.
     * @param {string} target - The Phone Number (08x...) or Tax ID (13 digits).
     * @param {number} [amount] - Optional amount in THB.
     * @returns {string} The raw payload string.
     */
    generatePayload(target, amount) {
        if (!target) throw new Error("PromptPay Target (Phone/ID) is required");

        // Sanitize target
        let sanitizedTarget = target.replace(/[^0-9]/g, '');

        // Basic validation
        if (sanitizedTarget.length !== 10 && sanitizedTarget.length !== 13) {
            // Try to handle formatted phone numbers like 081-234-5678 -> 0812345678
            // If it's still not 10 or 13, it might be an e-Wallet ID (15 digits), but standard is 10/13.
            // We'll warn but try to proceed if library handles it, or throw.
            // promptpay-qr lib usually expects clean strings.
            if (sanitizedTarget.startsWith('66')) {
                // Already international format? 
                // The lib handles conversion from 08x to 668x usually.
            }
        }

        // generatePayload parameters: (id, { amount })
        // The library handles the 08x -> 668x conversion automatically for phone numbers.
        try {
            // @ts-ignore
            const payload = generatePayload(sanitizedTarget, { amount: amount ? parseFloat(amount) : undefined });
            return payload;
        } catch (e) {
            console.error("PromptPay Generation Error:", e);
            throw new Error("Failed to generate PromptPay QR: " + e.message);
        }
    },

    /**
     * Validate if a string looks like a valid PromptPay ID.
     * @param {string} id 
     */
    isValidId(id) {
        if (!id) return false;
        const nums = id.replace(/[^0-9]/g, '');
        // Mobile (10) or Tax/Citizen ID (13)
        return nums.length === 10 || nums.length === 13;
    }
};
