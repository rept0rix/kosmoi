import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Scan() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold">Scan QR Code</h1>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl aspect-square flex items-center justify-center border-2 border-dashed border-slate-300">
                    <div className="text-center text-slate-400">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Camera permission required</p>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-slate-500">Scan a Kosmoi Pay QR code to pay instantly.</p>
                </div>
            </div>
        </div>
    );
}
