/**
 * ManyPi API Client
 * Base URL: https://app.manypi.com (Confirmed via probe)
 */
import axios from 'axios';

// Cross-environment safe access to env vars
const getSafeEnv = (key) => import.meta.env?.[key] || (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env[key] : null);
const MANYPI_API_KEY = getSafeEnv('VITE_MANYPI_API_KEY');
const BASE_URL = 'https://app.manypi.com/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${MANYPI_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/**
 * Verify API connection and user identity
 */
export const getUser = async () => {
    try {
        const response = await client.get('/user');
        return response.data;
    } catch (error) {
        console.error("ManyPi Auth Error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Send WhatsApp Message
 * @warn This endpoint is NOT CONFIRMED. It is a placeholder based on user request.
 * @param {string} phone 
 * @param {string} message 
 */
export const sendWhatsApp = async (phone, message) => {
    // Uses the generic /send endpoint or similar. 
    // The user should ensure VITE_MANYPI_API_URL is set to their endpoint if different.
    try {
        const response = await client.post('/send-message', {
            phone: phone,
            message: message
        });
        return response.data;
    } catch (error) {
        console.error("ManyPi Send Failed:", error.response?.data || error.message);
        throw error;
    }
};

export default client;
