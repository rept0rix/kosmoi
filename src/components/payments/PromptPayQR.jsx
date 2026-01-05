import React, { useMemo } from 'react';
import QRCode from 'react-qr-code';
import { PromptPayService } from '../../services/payments/PromptPayService';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PromptPayQR({ promptPayId, amount, className = "" }) {

    // Generate payload only when ID or amount changes
    const payload = useMemo(() => {
        if (!promptPayId) return null;
        try {
            return PromptPayService.generatePayload(promptPayId, amount);
        } catch (e) {
            console.error("QR Gen Error:", e);
            return null;
        }
    }, [promptPayId, amount]);

    if (!promptPayId) {
        return (
            <div className={`flex items-center justify-center p-4 bg-slate-100 rounded-lg text-slate-400 text-sm ${className}`}>
                No PromptPay ID
            </div>
        );
    }

    if (!payload) {
        return (
            <div className={`flex items-center justify-center p-4 bg-red-50 text-red-500 rounded-lg text-sm ${className}`}>
                Invalid ID
            </div>
        );
    }

    return (
        <Card className={`p-4 bg-white inline-flex flex-col items-center gap-3 shadow-sm border-slate-200 ${className}`}>
            <div className="relative">
                <QRCode
                    value={payload}
                    size={200}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    {/* Can put a logo in the middle if error correction allows, but M level is tight. */}
                </div>
            </div>

            <div className="text-center w-full">
                <img src="/bank_logos/promptpay_logo.png" alt="PromptPay" className="h-6 mx-auto mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div className="text-xs text-slate-500 font-mono">{promptPayId}</div>
                {amount && (
                    <div className="text-lg font-bold text-slate-900 mt-1">
                        ฿{amount.toLocaleString()}
                    </div>
                )}
            </div>
        </Card>
    );
}
