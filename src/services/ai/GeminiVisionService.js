import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * service for UI Analysis using Gemini Vision
 */
export const GeminiVisionService = {
    /**
     * Analyzes an image and returns a list of UI components
     * @param {string} base64Image - The image to analyze (data:image/...)
     * @returns {Promise<Array>} - List of identified UI nodes
     */
    async decomposeUI(base64Image) {
        if (!API_KEY) {
            throw new Error("Missing VITE_GEMINI_API_KEY");
        }

        try {
            // Remove data URL prefix if present
            const base64Data = base64Image.split(',')[1] || base64Image;

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
        You are an expert UI/UX Engineer and React Developer. 
        Analyze this UI screenshot and decompose it into a list of structural components.
        
        Return a JSON object with a single key "components" containing an array of items.
        Each item should have:
        - type: 'button' | 'input' | 'text' | 'image' | 'card' | 'container'
        - label: Text content or description
        - position: { x: number, y: number } (Approximate relative percentage 0-100)
        - style: { width: string, height: string, backgroundColor: string, color: string } (Approximate)
        
        Focus on the main interactive elements. Grouping containers are important.
        Do not return markdown fences, just pure JSON.
      `;

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png", // Assuming PNG/JPEG, API is flexible
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Clean markdown if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const data = JSON.parse(jsonStr);
            return data.components || [];

        } catch (error) {
            console.error("Gemini Vision Decompose Error:", error);
            throw error;
        }
    }
};
