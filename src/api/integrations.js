import { db } from './supabaseClient';
import { supabase } from './supabaseClient';


export const Core = {
    InvokeLLM: async ({ prompt, system_instruction, model: requestedModel, images = [] }) => {
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");

            // Get API key from local storage or env
            const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("API_KEY_MISSING");
            }

            const genAI = new GoogleGenerativeAI(apiKey);

            // List of models to try. We prioritize the requested model, then fall back to known available ones.
            // Based on available models: gemini-2.0-flash, gemini-3-pro-preview, etc.
            const modelsToTry = [
                requestedModel,
                "gemini-2.0-flash",
                "gemini-2.0-flash-lite",
                "gemini-3-pro-preview",
                "gemini-1.5-flash" // Keep as legacy fallback
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
    SendEmail: async () => { console.warn('SendEmail not implemented'); return {}; },
    SendSMS: async () => { console.warn('SendSMS not implemented'); return {}; },
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
    GenerateImage: async () => { console.warn('GenerateImage not implemented'); return {}; },
    ExtractDataFromUploadedFile: async () => { console.warn('ExtractDataFromUploadedFile not implemented'); return {}; }
};

export const InvokeLLM = Core.InvokeLLM;

export const SendEmail = Core.SendEmail;

export const SendSMS = Core.SendSMS;

export const UploadFile = Core.UploadFile;

export const GenerateImage = Core.GenerateImage;

export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;

