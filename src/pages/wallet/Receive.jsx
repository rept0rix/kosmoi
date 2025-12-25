import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { WalletService } from '@/services/WalletService';
// import QRCode from 'react-qr-code'; 

export default function Receive() {
    const navigate = useNavigate();

    const { data: wallet } = useQuery({
        queryKey: ['wallet'],
        queryFn: WalletService.getWallet
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold">Receive Money</h1>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm flex flex-col items-center gap-6">
                    <div className="bg-slate-100 p-4 rounded-xl">
                        {/* Placeholder for QR Code */}
                        <div className="w-48 h-48 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-2xl tracking-widest">QR CODE</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-slate-500 mb-1">Your Wallet ID</p>
                        <code className="bg-slate-100 px-3 py-1 rounded text-sm font-mono break-all">
                            {wallet?.id || 'Loading...'}
                        </code>
                    </div>

                    <div className="flex gap-4 w-full">
                        <Button variant="outline" className="flex-1">
                            <Copy className="mr-2 w-4 h-4" /> Copy
                        </Button>
                        <Button variant="outline" className="flex-1">
                            <Share2 className="mr-2 w-4 h-4" /> Share
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
