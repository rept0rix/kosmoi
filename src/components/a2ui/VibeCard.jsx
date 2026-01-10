import React, { useState } from 'react';
import { MapPin, Instagram, Clock, Star, Music, Sunset, Heart, Coffee } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { useNavigate } from 'react-router-dom';

// Map vibe keywords to icons
const VIBE_ICONS = {
    'hidden-gem': SparklesIcon,
    'sunset-view': Sunset,
    'romantic': Heart,
    'live-music': Music,
    'chill': Coffee,
    'party': MartiniIcon,
};

function SparklesIcon({ className }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>;
}

function MartiniIcon({ className }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8" /><path d="M12 11v11" /><path d="m19 3-7 8-7-8Z" /></svg>;
}

export default function VibeCard({
    id,
    title,
    description,
    image,
    vibes = [],
    priceLevel = '$$',
    rating = 4.5,
    location,
    status = 'open',
    instagram,
    link,
    distance,
    onClick
}) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const isOpen = status.toLowerCase() === 'open';

    const handleCardClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        if (id) {
            navigate(`/provider/${id}`);
        } else if (link) {
            window.open(link, '_blank');
        } else if (instagram) {
            const handle = instagram.replace('@', '');
            window.open(`https://instagram.com/${handle}`, '_blank');
        } else {
            // Robust Fallback: Search in marketplace
            console.warn("No specific ID or link for VibeCard, searching marketplace for:", title);
            navigate(`/marketplace?search=${encodeURIComponent(title)}`);
        }
    };

    const finalImage = (image && image !== 'url' && !imgError)
        ? image
        : "https://images.unsplash.com/photo-1512100356356-de1b84283e18?q=80&w=1000&auto=format&fit=crop";

    return (
        <div
            onClick={handleCardClick}
            className="group relative w-72 h-96 rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] cursor-pointer bg-slate-900 shrink-0 snap-center"
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={finalImage}
                    onError={() => setImgError(true)}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay - Cinematic feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-4">
                {vibes.slice(0, 3).map((vibe, i) => {
                    const Icon = VIBE_ICONS[vibe] || SparklesIcon;
                    return (
                        <Badge key={i} variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-0 text-[10px] px-2 py-1 h-6 gap-1">
                            <Icon className="w-3 h-3" />
                            <span className="capitalize">{vibe.replace('-', ' ')}</span>
                        </Badge>
                    );
                })}
            </div>

            <div className="absolute top-4 right-4">
                <div className={cn(
                    "px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 text-xs font-medium flex items-center gap-1.5",
                    isOpen ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOpen ? "bg-emerald-400" : "bg-red-400")} />
                    {isOpen ? "OPEN" : "CLOSED"}
                </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col gap-2">
                <div className="flex justify-between items-end">
                    <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">{title}</h3>
                    <span className="text-white/80 font-medium text-sm bg-black/30 px-2 py-0.5 rounded-md backdrop-blur-sm">{priceLevel}</span>
                </div>

                <p className="text-sm text-slate-300 line-clamp-2 font-light">{description}</p>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" />
                        <span>{rating}</span>
                    </div>
                    {distance && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{distance}</span>
                        </div>
                    )}
                    {instagram && (
                        <div className="flex items-center gap-1 text-pink-400 ml-auto">
                            <Instagram className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[80px]">{instagram.replace('@', '')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
