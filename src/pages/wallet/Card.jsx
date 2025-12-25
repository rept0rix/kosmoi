import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CardPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-md mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold">My Card</h1>
                </div>

                {/* Virtual Card Visualization */}
                <GlassCard className="aspect-[1.586] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-2xl transform transition-transform hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-lg font-['Outfit']">KOSMOI</span>
                            <CreditCard className="opacity-80" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4 font-mono text-xl tracking-wider opacity-90">
                                <span>••••</span>
                                <span>••••</span>
                                <span>••••</span>
                                <span>4242</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] opacity-60 uppercase">Card Holder</p>
                                    <p className="font-medium tracking-wide">NAOR YANKO</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] opacity-60 uppercase">Expires</p>
                                    <p className="font-medium">12/28</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 gap-4">
                    <Button variant="outline" className="h-14 justify-start px-4 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Lock className="mr-3 w-5 h-5" />
                        Freeze Card
                    </Button>
                    <Button variant="outline" className="h-14 justify-start px-4">
                        Settings & Limits
                    </Button>
                </div>
            </div>
        </div>
    );
}
