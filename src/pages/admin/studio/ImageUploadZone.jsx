import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ImageUploadZone({ onImageSelected, onClose, isAnalyzing }) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // Paste handler
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        processFile(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleAnalyze = () => {
        if (preview && onImageSelected) {
            onImageSelected(preview);
        }
    };

    return (
        <div className="absolute top-20 right-4 z-50 w-80">
            <Card className="p-4 shadow-xl border-slate-200 bg-white/95 backdrop-blur">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                        UI Decomposition
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {!preview ? (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="hidden"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleChange}
                        />
                        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-slate-400" />
                            <span className="text-xs text-slate-500">
                                Drag image or <span className="text-indigo-500 font-medium">click to upload</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Ctrl+V to paste</span>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0"
                                onClick={() => setPreview(null)}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing UI...
                                </>
                            ) : (
                                "Decompose UI"
                            )}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
