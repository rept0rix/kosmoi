import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

/**
 * Initializes the Gemini Interactions Client.
 */
const getClient = () => {
    const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) ||
        (import.meta.env?.VITE_GEMINI_API_KEY) ||
        (typeof globalThis !== 'undefined' && globalThis.process?.env ? (globalThis.process.env.VITE_GEMINI_API_KEY || globalThis.process.env.GEMINI_API_KEY) : null);

    if (!apiKey) {
        throw new Error("API_KEY_MISSING: Please configure VITE_GEMINI_API_KEY");
    }

    return new GoogleGenerativeAI(apiKey);
};

/**
 * Calls the Gemini Interactions API with Structured Output.
 */
export const callAgentInteraction = async ({ model, prompt, system_instruction, jsonSchema, jsonMode, images = [] }) => {
    try {
        const genAI = getClient();
        const modelName = model || 'gemini-2.0-flash-exp';

        const generationConfig = {
            maxOutputTokens: 2048,
            temperature: 0.7,
        };

        if (jsonSchema) {
            generationConfig.responseMimeType = 'application/json';
            generationConfig.responseSchema = jsonSchema;
        } else if (jsonMode) {
            generationConfig.responseMimeType = 'application/json';
        }

        const modelInstance = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: system_instruction ? { role: 'system', parts: [{ text: system_instruction }] } : undefined
        });

        const parts = [
            { text: prompt },
            ...(images || []).map(img => ({
                inlineData: {
                    data: img.base64.split(',')[1] || img.base64,
                    mimeType: img.mimeType || 'image/png'
                }
            }))
        ];

        // Retry Loop for 429 errors
        let result;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                result = await modelInstance.generateContent({
                    contents: [{ role: 'user', parts }],
                    generationConfig
                });
                break; // Success
            } catch (err) {
                if (err.status === 429 || err.code === 429 || (err.message && err.message.includes('429'))) {
                    console.warn(`⚠️ Gemini Rate Limit Exceeded (Attempt ${attempt + 1}/3). Waiting 65s...`);
                    await new Promise(resolve => setTimeout(resolve, 65000));
                    continue;
                }
                throw err;
            }
        }

        if (!result) throw new Error("Gemini API Request Failed after retries.");

        const response = await result.response;
        const outputText = response.text();

        if (!outputText) throw new Error("No text output received from Gemini.");

        try {
            return JSON.parse(outputText);
        } catch (e) {
            const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/) || outputText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch (e2) {
                    console.warn("Failed to parse extracted JSON:", e2);
                }
            }
            console.warn("Returning raw text wrapper.");
            return { message: outputText, raw: true };
        }

    } catch (error) {
        const errorLog = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\nData: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n\n`;
        fs.appendFileSync(path.resolve(process.cwd(), 'gemini_debug.log'), errorLog);
        console.error("Gemini Interaction Error (Full):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error("Gemini Interaction Message:", error.message);
        throw error;
    }
};
