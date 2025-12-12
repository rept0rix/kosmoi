import React, { useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon, X } from 'lucide-react';

export default function BoardRoomInput({
    input,
    setInput,
    onSend,
    isRTL,
    selectedImage,
    setSelectedImage,
    className
}) {
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-4 border-t bg-white/80 backdrop-blur-md">
            <div className={`flex gap-3 ${className || 'max-w-4xl mx-auto'}`}>
                <Input
                    placeholder={isRTL ? "כתוב הודעה לצוות..." : "Type a message to the board..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    className="shadow-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className={selectedImage ? "text-blue-600 border-blue-200 bg-blue-50" : "text-gray-400"}>
                    <ImageIcon className="w-4 h-4" />
                </Button>
                <Button onClick={onSend} className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white px-6">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
            {selectedImage && (
                <div className="max-w-4xl mx-auto mt-2 flex items-center gap-2">
                    <div className="relative group">
                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <span className="text-xs text-gray-400">Image attached</span>
                </div>
            )}
        </div>
    );
}
