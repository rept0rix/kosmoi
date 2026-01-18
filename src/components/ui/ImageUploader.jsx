import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/shared/lib/utils';

export function ImageUploader({
    value,
    onChange,
    bucket = 'uploads',
    folder = 'business-identities',
    multiple = false,
    className = ''
}) {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const newUrls = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                newUrls.push(data.publicUrl);
            }

            if (multiple) {
                onChange([...(value || []), ...newUrls]);
            } else {
                onChange(newUrls[0]);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: "Upload Failed",
                description: "There was an error uploading your image. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (urlToRemove) => {
        if (multiple) {
            onChange(value.filter(url => url !== urlToRemove));
        } else {
            onChange(null);
        }
    };

    // Single Image View
    if (!multiple) {
        return (
            <div className={cn("space-y-4", className)}>
                <div
                    className={cn(
                        "relative aspect-video rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors hover:bg-muted/50 cursor-pointer",
                        value ? "border-primary" : "border-muted-foreground/25"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {value ? (
                        <img src={value} alt="Uploaded" className="object-cover w-full h-full" />
                    ) : (
                        <div className="text-center space-y-2">
                            <div className="p-4 rounded-full bg-primary/10 inline-flex">
                                <ImageIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Click to upload logo</p>
                                <p className="text-xs text-muted-foreground/70">PNG, JPG up to 5MB</p>
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                />

                {value && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(value);
                        }}
                        className="w-full text-destructive hover:text-destructive"
                    >
                        <X className="w-4 h-4 mr-2" /> Remove Logo
                    </Button>
                )}
            </div>
        );
    }

    // Multiple Images View (Gallery)
    return (
        <div className={cn("space-y-4", className)}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Existing Images */}
                {(value || []).map((url, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-lg border overflow-hidden">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="object-cover w-full h-full" />
                        <button
                            onClick={() => handleRemove(url)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground transition-opacity opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Upload Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">Add Photo</span>
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleUpload}
            />
        </div>
    );
}
