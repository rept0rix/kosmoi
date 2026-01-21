import React from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdService } from '@/services/AdService';

export default function ChatAd({ ad }) {
    if (!ad) return null;

    const handleClick = () => {
        AdService.trackClick(ad.id);
        if (ad.cta_link) {
            window.open(ad.cta_link, '_blank');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="my-4 mx-4 max-w-sm sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-yellow-500/30 rounded-2xl shadow-lg shadow-yellow-900/10 overflow-hidden relative group"
        >
            {/* Sponsored Badge */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl border-l border-b border-yellow-500/20 backdrop-blur-sm">
                Sponsored
            </div>

            <div className="p-5">
                {/* Header: Provider Info */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 overflow-hidden shrink-0">
                         {ad.service_providers?.logo_url ? (
                            <img src={ad.service_providers.logo_url} alt="Logo" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Store size={20} />
                            </div>
                         )}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm leading-tight">{ad.service_providers?.business_name || 'Partner'}</h4>
                        <div className="flex items-center text-xs text-slate-400 mt-0.5">
                            <MapPin size={10} className="mr-1" /> Nearby
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200 mb-2">
                    {ad.headline}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {ad.content}
                </p>

                {/* CTA */}
                <Button 
                    onClick={handleClick}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-semibold shadow-gold-glow transition-all active:scale-95"
                >
                    {ad.cta_text || 'View Offer'} <ExternalLink size={16} className="ml-2 opacity-70" />
                </Button>
            </div>
            
            {/* Decorative Glow */}
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-yellow-500/20 transition-all duration-500" />
        </motion.div>
    );
}
