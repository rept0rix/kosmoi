/**
 * Service to handle payment logic, mimicking a Fintech API.
 */
export const PaymentService = {
    /**
     * Create a payment link
     * @param {number} amount 
     * @param {string} currency 
     * @param {string} description 
     * @returns {Promise<Object>} Payment link object
     */
    createPaymentLink: async (amount, currency = 'USD', description) => {
        console.log(`Creating payment link: ${amount} ${currency} for ${description}`);

        return new Promise((resolve) => {
            setTimeout(() => {
                const id = `pay_${Date.now()}`;
                resolve({
                    id,
                    url: `https://pay.kosmoi.com/${id}`,
                    amount,
                    currency,
                    description,
                    status: 'pending'
                });
            }, 800);
        });
    },

    /**
     * Get wallet balance for a user.
     * Persists to localStorage for the "One Dollar Challenge" feel.
     * @param {string} walletId 
     * @returns {Promise<Object>} Balance object
     */
    getBalance: async (walletId = 'default') => {
        // Mock persistence
        const storageKey = `wallet_${walletId}`;
        let balance = parseFloat(localStorage.getItem(storageKey));

        if (isNaN(balance)) {
            balance = 1000.00; // Starting credit
            localStorage.setItem(storageKey, balance.toString());
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    walletId,
                    available: balance,
                    pending: 0.00,
                    currency: 'USD'
                });
            }, 300);
        });
    },

    /**
     * Add credits to wallet
     * @param {number} amount 
     * @param {string} walletId 
     */
    addCredits: async (amount, walletId = 'default') => {
        const storageKey = `wallet_${walletId}`;
        let balance = parseFloat(localStorage.getItem(storageKey) || "0");
        balance += amount;
        localStorage.setItem(storageKey, balance.toString());
        return { success: true, newBalance: balance };
    },

    /**
     * Deduct credits from wallet
     * @param {number} amount 
     * @param {string} walletId 
     */
    deductCredits: async (amount, walletId = 'default') => {
        const storageKey = `wallet_${walletId}`;
        let balance = parseFloat(localStorage.getItem(storageKey) || "0");

        if (balance < amount) {
            throw new Error("Insufficient funds");
        }

        balance -= amount;
        localStorage.setItem(storageKey, balance.toString());
        return { success: true, newBalance: balance };
    },

    /**
     * Get transaction history
     * @param {string} walletId 
     * @returns {Promise<Array>} List of transactions
     */
    getTransactionHistory: async (walletId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    { id: 'tx_1', date: '2025-10-01', amount: 50, description: 'Service Fee', type: 'credit' },
                    { id: 'tx_2', date: '2025-10-02', amount: -10, description: 'Platform Fee', type: 'debit' }
                ]);
            }, 600);
        });
    }
};
