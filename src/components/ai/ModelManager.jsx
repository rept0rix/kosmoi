import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, CheckCircle, Database } from 'lucide-react';

const AVAILABLE_MODELS = [
    {
        id: "Llama-3-8B-Instruct-q4f32_1-MLC",
        name: "Llama 3 (8B) - Balanced",
        size: "~5GB",
        desc: "Best overall performance. Good for reasoning."
    },
    {
        id: "Gemma-2b-it-q4f32_1-MLC",
        name: "Gemma (2B) - Lite",
        size: "~1.5GB",
        desc: "Fastest. Low memory usage. Good for simple tasks."
    },
    {
        id: "Mistral-7B-Instruct-v0.2-q4f16_1-MLC",
        name: "Mistral 7B",
        size: "~4GB",
        desc: "Strong alternative to Llama."
    }
];

export default function LocalModelManager({ selectedModelId, onModelSelect, onInit, isDownloading, isReady, loadingText }) {
    const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    Local AI Models
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Select Model</label>
                    <Select value={selectedModelId} onValueChange={onModelSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                            {AVAILABLE_MODELS.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                    <div className="flex flex-col items-start py-1">
                                        <span className="font-medium">{model.name}</span>
                                        <span className="text-xs text-gray-500">{model.size} • {model.desc}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isReady ? (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Model loaded and ready for inference
                    </div>
                ) : (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
                        <p className="font-semibold mb-1">Status: {loadingText || "Waiting to load..."}</p>
                        {isDownloading && <p className="text-xs opacity-75">Large file download in progress. Do not close tab.</p>}
                    </div>
                )}

                {!isReady && (
                    <Button
                        onClick={() => onInit(selectedModelId)}
                        disabled={isDownloading}
                        className="w-full"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Downloading & Initializing...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Load Model (Free)
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
