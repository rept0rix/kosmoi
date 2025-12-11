import React, { useState, useRef, useEffect } from 'react';
import { useLocalLLM } from '@/services/ai/useLocalLLM';
import LocalModelManager from '@/components/ai/ModelManager';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Trash, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Markdown from 'react-markdown';

export default function LocalBrain() {
    const {
        isReady,
        isDownloading,
        loadingText,
        isGenerating,
        response,
        initModel,
        generate,
        reset,
        error
    } = useLocalLLM();

    const [selectedModelId, setSelectedModelId] = useState("Llama-3-8B-Instruct-q4f32_1-MLC");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, response]);

    const handleSend = () => {
        if (!input.trim() || !isReady || isGenerating) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        generate(input);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = () => {
        reset();
        setMessages([]);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">🧠 Local Brain</h1>
                <p className="text-gray-600">
                    Run powerful AI models directly in your browser. Private, free, and offline-capable.
                </p>
            </div>

            {/* Model Selection & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <LocalModelManager
                        selectedModelId={selectedModelId}
                        onModelSelect={setSelectedModelId}
                        onInit={initModel}
                        isDownloading={isDownloading}
                        isReady={isReady}
                        loadingText={loadingText}
                    />

                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                        <div className="flex items-center gap-1 font-semibold mb-1">
                            <Info className="w-3 h-3" />
                            <span>Hardware Requirement</span>
                        </div>
                        <p>Requires a GPU with WebGPU support (Chrome 113+). Initial download is large (~2GB-5GB). Model is cached for future visits.</p>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="md:col-span-2">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bot className="w-5 h-5 text-purple-600" />
                                Chat Session
                            </CardTitle>
                            {messages.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={handleClear} disabled={isGenerating}>
                                    <Trash className="w-4 h-4 mr-2" />
                                    Clear Chat
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="flex-1 p-0 overflow-hidden relative bg-gray-50/50">
                            <ScrollArea className="h-full p-4">
                                {messages.length === 0 && !isGenerating && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-8 opacity-50">
                                        <Bot className="w-16 h-16 mb-4" />
                                        <p>Load a model and say hello to start chatting locally.</p>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                            }`}>
                                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                        </div>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border shadow-sm rounded-tl-none text-gray-800'
                                            }`}>
                                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                                <Markdown>{msg.content}</Markdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Live Response Stream */}
                                {isGenerating && (
                                    <div className="flex gap-3 mb-4 flex-row">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-5 h-5" />
                                        </div>
                                        <div className="max-w-[80%] bg-white border shadow-sm rounded-2xl rounded-tl-none px-4 py-3 text-gray-800">
                                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                                <Markdown>{response}</Markdown>
                                            </div>
                                            <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse"></span>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <Alert variant="destructive" className="mt-4 mb-4">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div ref={messagesEndRef} />
                            </ScrollArea>
                        </CardContent>

                        <CardFooter className="p-3 border-t bg-white">
                            <form
                                className="flex w-full items-center gap-2"
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            >
                                <Input
                                    placeholder={!isReady ? "Please load a model first..." : "Type a message..."}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={!isReady || isGenerating}
                                    className="flex-1"
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    aria-label="Send Message"
                                    disabled={!isReady || isGenerating || !input.trim()}
                                    className={isGenerating ? "animate-pulse" : ""}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
