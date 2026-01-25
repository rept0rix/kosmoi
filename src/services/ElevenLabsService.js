/**
 * Service for interacting with ElevenLabs API.
 * Handles Text-to-Speech, Music Generation, and Transcription.
 */
export const ElevenLabsService = {
    apiKey: (import.meta.env?.VITE_ELEVENLABS_API_KEY) ||
        (typeof globalThis !== 'undefined' && globalThis.process?.env ? (globalThis.process.env.VITE_ELEVENLABS_API_KEY || globalThis.process.env.ELEVENLABS_API_KEY) : null),

    getHeaders() {
        if (!this.apiKey) {
            throw new Error("ElevenLabs API Key is missing. Add VITE_ELEVENLABS_API_KEY to .env");
        }
        return {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json"
        };
    },

    /**
     * Generate speech from text.
     * @param {string} text 
     * @param {string} voiceId - Optional voice ID (Default: Predefined)
     */
    async generateSpeech(text, voiceId = "pNInz6obpg8nEByWQX2V") { // Default: Adam
        console.log(`[ElevenLabs] Generating speech for: ${text.substring(0, 30)}...`);
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`ElevenLabs Speech Error: ${err}`);
        }

        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer);
    },

    /**
     * Generate music background.
     * @param {string} prompt 
     * @param {number} durationMs 
     */
    async generateMusic(prompt, durationMs = 30000) {
        console.log(`[ElevenLabs] Generating music (${durationMs}ms): ${prompt}`);
        const response = await fetch("https://api.elevenlabs.io/v1/music", {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                prompt,
                duration_ms: durationMs
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`ElevenLabs Music Error: ${err}`);
        }

        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer);
    },

    /**
     * Transcribe audio and get word-level timing (Scribe v2).
     * @param {Buffer} audioBuffer
     */
    async transcribe(audioBuffer) {
        console.log(`[ElevenLabs] Transcribing audio content...`);
        // Note: For multipart/form-data we don't use the JSON header
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        formData.append('file', blob, 'audio.mp3');
        formData.append('model_id', 'scribe_v1'); // or v2 if available

        const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
            method: 'POST',
            headers: {
                "xi-api-key": this.apiKey
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`ElevenLabs Transcription Error: ${err}`);
        }

        return await response.json();
    }
};
