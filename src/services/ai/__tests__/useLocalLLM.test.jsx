import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalLLM } from '../useLocalLLM';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Worker
class MockWorker {
    constructor(url) {
        this.url = url;
        this.onmessage = null;
    }

    postMessage(msg) {
        // Simulate async handling
        setTimeout(() => this.handleMessage(msg), 0);
    }

    handleMessage(msg) {
        // Echo or logic based on msg type
        if (msg.type === 'INIT') {
            // Simulate start
            this.onmessage({ data: { type: 'INIT_START', payload: { modelId: "test-model" } } });
            // Simulate init progress
            this.onmessage({ data: { type: 'INIT_PROGRESS', payload: { progress: 0.5, text: "Loading..." } } });
            // Simulate complete
            setTimeout(() => {
                this.onmessage({ data: { type: 'INIT_COMPLETE' } });
            }, 50);
        } else if (msg.type === 'GENERATE') {
            // Simulate generation
            this.onmessage({ data: { type: 'GENERATE_PROGRESS', payload: { fullResponse: "Hello" } } });
            setTimeout(() => {
                this.onmessage({ data: { type: 'GENERATE_COMPLETE', payload: { output: "Hello world" } } });
            }, 50);
        }
    }

    terminate() { }
}

describe('useLocalLLM Hook', () => {
    let originalWorker;

    beforeEach(() => {
        originalWorker = window.Worker;
        window.Worker = MockWorker;
        vi.useFakeTimers();
    });

    afterEach(() => {
        window.Worker = originalWorker;
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useLocalLLM());

        expect(result.current.isReady).toBe(false);
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should handle model initialization', async () => {
        const { result } = renderHook(() => useLocalLLM());

        // Trigger Init
        act(() => {
            result.current.initModel("Llama-3");
        });

        // Check downloading state
        // Initial init sets isDownloading to true immediately? 
        // Logic in hook: worker postMessage 'INIT'
        // Worker responds 'INIT_PROGRESS' -> isDownloading = true

        await act(async () => {
            vi.advanceTimersByTime(10); // Trigger MockWorker process
        });

        expect(result.current.isDownloading).toBe(true);
        expect(result.current.loadingText).toBe("Loading...");

        // Finish init
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        expect(result.current.isReady).toBe(true);
        expect(result.current.isDownloading).toBe(false);
    });

    it('should generate text and handle promise resolution', async () => {
        const { result } = renderHook(() => useLocalLLM());

        // Fast forward init
        act(() => {
            result.current.initModel("Llama-3");
        });
        await act(async () => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current.isReady).toBe(true);

        // Call generate
        let promise;
        act(() => {
            promise = result.current.generate("Hi");
        });

        expect(result.current.isGenerating).toBe(true);

        // Advance timers to trigger worker response
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const output = await promise;
        expect(output).toBe("Hello world");
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.response).toBe("Hello world");
    });
});
