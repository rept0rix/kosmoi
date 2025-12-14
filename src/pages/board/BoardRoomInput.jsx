import React, { useRef } from 'react';
import { Input } from "@/components/ui/input";
import { GlassButton } from "@/components/ui/GlassButton";
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
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
            <div className={`flex gap-3 ${className || 'max-w-4xl mx-auto'}`}>
                <Input
                    placeholder={isRTL ? "כתוב הודעה לצוות..." : "Type a message to the board..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    className="shadow-inner border-white/10 focus:border-primary/50 focus:ring-primary/20 bg-white/5 text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <GlassButton variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className={selectedImage ? "text-primary border-primary/20 bg-primary/10" : "text-muted-foreground"}>
                    <ImageIcon className="w-4 h-4" />
                </GlassButton>
                <GlassButton variant="primary" onClick={onSend} className="px-6">
                    <Send className="w-4 h-4" />
                </GlassButton>
            </div>
            {selectedImage && (
                <div className="max-w-4xl mx-auto mt-2 flex items-center gap-2">
                    <div className="relative group">
                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <span className="text-xs text-muted-foreground">Image attached</span>
                </div>
            )}
        </div>
    );
}
