import 'dotenv/config';
import fetch from 'node-fetch';

const API_KEY = process.env.VITE_MANYPI_API_KEY;

const CANDIDATE_URLS = [
    'https://api.manypi.com',
    'https://manypi.com/api',
    'https://app.manypi.com/api'
];

async function probeEndpoint(baseUrl, path, method = 'GET', body = null) {
    const url = `${baseUrl}${path}`;
    console.log(`\n--- Probing ${method} ${url} ---`);

    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        // Add timeout to avoid hanging on dead domains
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        options.signal = controller.signal;

        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        clearTimeout(timeout);

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);
        const preview = text.substring(0, 200).replace(/\n/g, ' ');
        console.log(`Response: ${preview}...`);

        // Return true if we hit a likely API (JSON response or 401/403/200, NOT HTML)
        if (!text.trim().startsWith('<!DOCTYPE') && !text.includes('<html')) {
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return false;
    }
}

async function main() {
    if (!API_KEY) {
        console.error("Error: VITE_MANYPI_API_KEY is not set in .env");
        return;
    }

    console.log("Starting ManyPi API Probe (Round 2)...");

    const endpoints = [
        '/v1/user',
        '/user',
        '/v1/whatsapp/send',
        '/whatsapp/send'
    ];

    for (const baseUrl of CANDIDATE_URLS) {
        console.log(`\n=== Testing Base URL: ${baseUrl} ===`);
        let hits = 0;
        for (const endpoint of endpoints) {
            const isApi = await probeEndpoint(baseUrl, endpoint);
            if (isApi) hits++;
        }

        if (hits > 0) {
            console.log(`\n✅ POTENTIAL WINNER: ${baseUrl}`);
        }
    }
}
main();
