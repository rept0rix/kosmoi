import { CreateMLCEngine } from "@mlc-ai/web-llm";

let engine = null;

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'INIT':
                await initializeEngine(payload.modelId, payload.config);
                break;
            case 'GENERATE':
                // Support payload.input (new) or payload.prompt (legacy)
                await generateText(payload.input || payload.prompt, payload.options);
                break;
            case 'RESET':
                if (engine) {
                    await engine.resetChat();
                }
                self.postMessage({ type: 'RESET_COMPLETE' });
                break;
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', payload: error.message });
    }
};

async function initializeEngine(modelId, config = {}) {
    // Notify starting
    self.postMessage({ type: 'INIT_START', payload: { modelId } });

    const initProgressCallback = (report) => {
        self.postMessage({
            type: 'INIT_PROGRESS',
            payload: report
        });
    };

    engine = await CreateMLCEngine(modelId, {
        initProgressCallback,
        ...config
    });

    self.postMessage({ type: 'INIT_COMPLETE' });
}

async function generateText(input, options = {}) {
    if (!engine) {
        throw new Error("Engine not initialized");
    }

    // Support both simple prompt string (legacy) and full messages array (chat)
    let messages = [];
    if (Array.isArray(input)) {
        messages = input;
    } else {
        messages = [
            { role: "user", content: input }
        ];
    }

    const chunks = await engine.chat.completions.create({
        messages,
        temperature: 0.7,
        stream: true,
        ...options
    });

    let fullResponse = "";

    for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta.content || "";
        fullResponse += delta;
        self.postMessage({
            type: 'GENERATE_PROGRESS',
            payload: { delta, fullResponse }
        });
    }

    self.postMessage({
        type: 'GENERATE_COMPLETE',
        payload: { output: fullResponse }
    });
}
