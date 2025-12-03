import React from 'react';
import { useWeather, getWeatherDescription } from '@/hooks/useWeather';
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind } from 'lucide-react';

const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return <Sun className="w-8 h-8 text-yellow-500" />;
    if (code === 2 || code === 3) return <Cloud className="w-8 h-8 text-gray-400" />;
    if ([45, 48].includes(code)) return <Wind className="w-8 h-8 text-gray-400" />;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="w-8 h-8 text-blue-200" />;
    if ([95, 96, 99].includes(code)) return <CloudLightning className="w-8 h-8 text-yellow-600" />;
    return <Sun className="w-8 h-8 text-yellow-500" />;
};

export default function WeatherWidget() {
    const { data, isLoading, error } = useWeather();

    if (isLoading) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl"></div>;
    if (error) return null;

    const current = data.current;
    const daily = data.daily;
    const description = getWeatherDescription(current.weather_code);

    return (
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <Sun className="w-32 h-32" />
            </div>
            <CardContent className="p-4 flex items-center justify-between relative z-10">
                <div>
                    <div className="text-xs font-medium text-blue-100 mb-1">Koh Samui</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{Math.round(current.temperature_2m)}°</span>
                        <span className="text-sm text-blue-100">{description}</span>
                    </div>
                    <div className="text-xs text-blue-100 mt-1 flex gap-2">
                        <span>H: {Math.round(daily.temperature_2m_max[0])}°</span>
                        <span>L: {Math.round(daily.temperature_2m_min[0])}°</span>
                    </div>
                </div>
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    {getWeatherIcon(current.weather_code)}
                </div>
            </CardContent>
        </Card>
    );
}
