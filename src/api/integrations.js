import { db } from './supabaseClient.js';
import { supabase } from './supabaseClient.js';


export const Core = {
    InvokeLLM: async ({ prompt, system_instruction, model: requestedModel, images = [] }) => {
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");

            const getSafeEnv = (key) => import.meta.env?.[key] || (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env[key] : null);

            // Get API key from local storage or env
            const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) ||
                getSafeEnv('VITE_GEMINI_API_KEY');

            if (!apiKey) {
                throw new Error("API_KEY_MISSING");
            }

            const genAI = new GoogleGenerativeAI(apiKey);

            // 0. Model Mapping / Override
            // Force legacy/unavailable models to newer versions to avoid initial 404/400 errors
            if (requestedModel === 'gemini-1.5-flash' || requestedModel === 'gemini-1.5-pro') {
                requestedModel = 'gemini-2.0-flash';
            }
            // If the user specifically asked for 3-pro, ensure it's the preview
            if (requestedModel === 'gemini-3-pro') {
                requestedModel = 'gemini-3-pro-preview';
            }

            // List of models to try. We prioritize the requested model, then fall back to known available ones.
            // Based on available models: gemini-2.0-flash, gemini-3-pro-preview, etc.
            const modelsToTry = [
                requestedModel,
                "gemini-2.0-flash",
                "gemini-2.0-flash-exp",
                "gemini-2.0-flash-lite",
                "gemini-3-pro-preview"
            ].filter(Boolean); // Remove null/undefined

            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: system_instruction
                    });

                    // Construct content parts (Text + Images)
                    const contentParts = [];
                    contentParts.push({ text: prompt });

                    if (images && images.length > 0) {
                        images.forEach(img => {
                            // Ensure base64 string is clean (remove data:image/png;base64, prefix if present)
                            const base64Data = img.base64.split(',')[1] || img.base64;
                            contentParts.push({
                                inlineData: {
                                    data: base64Data,
                                    mimeType: img.mimeType || 'image/png'
                                }
                            });
                        });
                    }

                    const result = await model.generateContent(contentParts);
                    const response = await result.response;
                    const text = response.text();

                    return { text };
                } catch (error) {
                    // console.warn(`Failed to use model ${modelName}:`, error.message);
                    lastError = error;
                    // Continue to next model
                }
            }

            // If we get here, all models failed
            throw lastError || new Error("All models failed to generate content");

        } catch (error) {
            console.error("LLM Error:", error);
            throw error;
        }
    },
    SendEmail: async ({ to, subject, html, from = "onboarding@resend.dev" }) => {
        console.log(`[Integrations] Sending email to ${to} via Edge Function...`);

        try {
            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to,
                    subject,
                    html,
                    from
                }
            });

            if (error) throw error;
            return { id: data?.id || "sent-via-edge", status: "success" };
        } catch (error) {
            console.error("Email Error (Edge):", error);
            // Fallback for dev if needed, or just return error
            return { error: error.message };
        }
    },
    SendSMS: async () => { console.warn('SendSMS not implemented'); return {}; },
    SendTelegram: async ({ message, chatId = "7224939578" }) => {
        console.log(`[Integrations] Sending Telegram to ${chatId}...`);
        const getSafeEnv = (key) => import.meta.env?.[key] || (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env[key] : null);
        const token = getSafeEnv('VITE_TELEGRAM_BOT_TOKEN') || getSafeEnv('TELEGRAM_BOT_TOKEN');

        if (!token) {
            console.warn("Missing Telegram Bot Token.");
            return { error: "Missing Telegram Bot Token configuration" };
        }

        try {
            // We use fetch (native in Node 18+ and Browser)
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.description || 'Failed to send Telegram');
            }

            const data = await res.json();
            return { status: "success", message_id: data.result.message_id };
        } catch (error) {
            console.error("Telegram Error:", error);
            return { error: error.message };
        }
    },
    UploadFile: async ({ file }) => {
        if (!file) throw new Error('No file provided');

        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        return { file_url: publicUrl };
    },
    GenerateImage: async ({ prompt, aspectRatio = "16:9" }) => {
        console.log(`[Integrations] Generating image for: "${prompt}"...`);
        try {
            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('generate-image', {
                body: {
                    prompt,
                    aspectRatio,
                    resolution: "1024x1024" // Default resolution
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // The function returns base64. We should probably upload it to storage to get a URL, 
            // or return it as data URI. For now, let's return data URI.
            const imageUrl = `data:image/jpeg;base64,${data.imageBase64}`;

            // OPTIONAL: Upload to Supabase Storage to make it persistent
            // const uploadRes = await Core.UploadFile({ file: dataURItoBlob(imageUrl) });
            // return { url: uploadRes.file_url };

            return { url: imageUrl, base64: data.imageBase64 };
        } catch (error) {
            console.error("GenerateImage Error:", error);
            // Fallback to placeholder if function fails (e.g. local dev without edge functions)
            return {
                url: `https://placehold.co/600x400/png?text=${encodeURIComponent(prompt)}`,
                error: error.message
            };
        }
    },
    ExtractDataFromUploadedFile: async () => { console.warn('ExtractDataFromUploadedFile not implemented'); return {}; },
    CreatePaymentLink: async ({ name, amount, currency = 'thb', metadata = {}, success_url, cancel_url }) => {
        console.log(`[Integrations] Creating payment link for ${name} ($${amount}) via Edge Function...`);

        try {
            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('create-payment-link', {
                body: { name, amount, currency, metadata, success_url, cancel_url }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            return { url: data?.url, id: data?.id };
        } catch (error) {
            console.error("Stripe Error (Edge):", error);
            return { error: error.message };
        }
    },
    GetEmbedding: async ({ text }) => {
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const getSafeEnv = (key) => import.meta.env?.[key] || (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env[key] : null);
            const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) ||
                getSafeEnv('VITE_GEMINI_API_KEY');

            if (!apiKey) return null;

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error("Embedding Error:", error);
            return null;
        }
    },
    SendN8NEmail: async ({ to, subject, body, campaignId }) => {
        const { n8nService } = await import('../services/integrations/N8NService.js');
        return await n8nService.triggerEmail({ to, subject, body, campaignId });
    },
    SendN8NWhatsApp: async ({ phone, message, templateId }) => {
        const { n8nService } = await import('../services/integrations/N8NService.js');
        return await n8nService.triggerWhatsApp({ phone, message, templateId });
    }
};

export const InvokeLLM = Core.InvokeLLM;

export const SendEmail = Core.SendEmail;

export const SendSMS = Core.SendSMS;

export const SendTelegram = Core.SendTelegram;

export const UploadFile = Core.UploadFile;

export const GenerateImage = Core.GenerateImage;

export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;

export const CreatePaymentLink = Core.CreatePaymentLink;

export const GetEmbedding = Core.GetEmbedding;

export const SendN8NEmail = Core.SendN8NEmail;

export const SendN8NWhatsApp = Core.SendN8NWhatsApp;

