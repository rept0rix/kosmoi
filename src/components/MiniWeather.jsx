
import React from 'react';
import { useWeather, getWeatherDescription } from '@/hooks/useWeather';
import { Cloud, Sun, Loader2 } from 'lucide-react';

export default function MiniWeather() {
    const { data, isLoading } = useWeather();

    if (isLoading || !data?.current) return null;

    const temp = Math.round(data.current.temperature_2m);
    const isDay = data.current.is_day === 1;

    return (
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm text-xs font-medium text-gray-700 animate-in fade-in duration-700">
            {isDay ? (
                <Sun className="w-4 h-4 text-orange-400" />
            ) : (
                <Cloud className="w-4 h-4 text-blue-400" />
            )}
            <span>Koh Samui</span>
            <span className="font-bold">{temp}°</span>
        </div>
    );
}
