import { useState, useEffect, useRef, useCallback } from 'react';

const WORKER_PATH = new URL('./LocalLLMWorker.js', import.meta.url).href;

export function useLocalLLM() {
    const workerRef = useRef(null);
    const pendingParamsRef = useRef(null); // { resolve, reject }
    const [isReady, setIsReady] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [response, setResponse] = useState('');
    const [error, setError] = useState(null);
    const [loadingText, setLoadingText] = useState('');

    useEffect(() => {
        // Initialize worker
        if (!workerRef.current) {
            workerRef.current = new Worker(WORKER_PATH, { type: 'module' });

            workerRef.current.onmessage = (e) => {
                const { type, payload } = e.data;

                switch (type) {
                    case 'INIT_START':
                        setIsDownloading(true);
                        setIsReady(false);
                        setLoadingText(`Loading model: ${payload.modelId}...`);
                        break;
                    case 'INIT_PROGRESS':
                        setLoadingText(payload.text);
                        break;
                    case 'INIT_COMPLETE':
                        setIsDownloading(false);
                        setIsReady(true);
                        setLoadingText('Model ready');
                        break;
                    case 'GENERATE_PROGRESS':
                        setIsGenerating(true);
                        setResponse(payload.fullResponse);
                        break;
                    case 'GENERATE_COMPLETE':
                        setIsGenerating(false);
                        setResponse(payload.output);
                        if (pendingParamsRef.current) {
                            pendingParamsRef.current.resolve(payload.output);
                            pendingParamsRef.current = null;
                        }
                        break;
                    case 'ERROR':
                        setError(payload);
                        setIsDownloading(false);
                        setIsGenerating(false);
                        if (pendingParamsRef.current) {
                            pendingParamsRef.current.reject(payload);
                            pendingParamsRef.current = null;
                        }
                        break;
                }
            };
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const initModel = useCallback((modelId, config = {}) => {
        setError(null);
        workerRef.current.postMessage({
            type: 'INIT',
            payload: { modelId, config }
        });
    }, []);

    const generate = useCallback((input, options = {}) => {
        return new Promise((resolve, reject) => {
            pendingParamsRef.current = { resolve, reject };
            setError(null);
            setResponse('');
            setIsGenerating(true);
            workerRef.current.postMessage({
                type: 'GENERATE',
                payload: { input, options }
            });
        });
    }, []);

    const reset = useCallback(() => {
        workerRef.current.postMessage({ type: 'RESET' });
        setResponse('');
    }, []);

    return {
        isReady,
        isDownloading,
        downloadProgress,
        loadingText,
        isGenerating,
        response,
        error,
        initModel,
        generate,
        reset
    };
}
