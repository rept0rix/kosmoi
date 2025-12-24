
import React from 'react';
import { useWeather, getWeatherDescription } from '@/shared/hooks/useWeather';
import { Cloud, Sun, Loader2, Wind, Droplets, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function MiniWeather() {
    const { data, isLoading } = useWeather();

    if (isLoading || !data?.current) return null;

    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // Helper to get hourly data for the rest of the day
    const getNextHours = () => {
        if (!hourly) return [];

        // Calculate current time in Asia/Bangkok (UTC+7) to match API response
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const samuiOffset = 7 * 60 * 60 * 1000;
        const nowInSamui = new Date(utc + samuiOffset);
        const nowInSamuiIso = nowInSamui.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

        return hourly.time.map((t, i) => ({
            time: t,
            temp: hourly.temperature_2m[i],
            code: hourly.weather_code[i],
            rainProb: hourly.precipitation_probability[i]
        })).filter(h => h.time > nowInSamuiIso).slice(0, 24); // Next 24 hours
    };

    // Helper to get daily forecast
    const getDailyForecast = () => {
        if (!daily) return [];
        return daily.time.map((t, i) => ({
            date: t, // ISO Date string
            code: daily.weather_code[i],
            maxTemp: daily.temperature_2m_max[i],
            minTemp: daily.temperature_2m_min[i],
            rainProb: daily.precipitation_probability_max?.[i] || 0
        }));
    };

    const nextHours = getNextHours();
    const dailyForecast = getDailyForecast();
    const temp = Math.round(current.temperature_2m);
    const isDay = current.is_day === 1;

    // Dynamic Background Logic
    const getWeatherBackground = (code, isDay) => {
        // Rain/Thunder
        if (code >= 50) return "url('https://images.unsplash.com/photo-1519692933481-e162a57d6725?q=80&w=600&auto=format&fit=crop')"; // Rainy tropical
        // Cloudy
        if (code > 2) return "url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=600&auto=format&fit=crop')"; // Cloudy sky
        // Clear/Sun
        if (isDay) return "url('https://images.unsplash.com/photo-1540206395-688085723adb?q=80&w=600&auto=format&fit=crop')"; // Sunny Koh Samui Beach
        // Night
        return "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop')"; // Starry/Night beach
    };

    const bgImage = getWeatherBackground(current.weather_code, isDay);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm text-xs font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer">
                    {isDay ? (
                        <Sun className="w-4 h-4 text-orange-400" />
                    ) : (
                        <Cloud className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="hidden md:inline">Koh Samui</span>
                    <span className="font-bold">{temp}°</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden border-0 shadow-xl" align="end">
                {/* Main Card with Dynamic Background */}
                <div
                    className="relative text-white p-5 bg-cover bg-center transition-all duration-500"
                    style={{ backgroundImage: bgImage }}
                >
                    {/* Dark Overlay for minimal text readability enhancement */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-lg font-bold flex items-center gap-2 shadow-sm text-shadow">
                                    <MapPinIcon /> Koh Samui
                                </h4>
                                <p className="text-white/90 text-sm font-medium">{format(new Date(), 'EEEE, d MMMM')}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold tracking-tighter shadow-sm">{temp}°</div>
                                <div className="text-sm font-medium text-white/90">{getWeatherDescription(current.weather_code)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-sm bg-black/20 rounded-xl p-3 backdrop-blur-md border border-white/10">
                            <div className="flex flex-col items-center gap-1">
                                <Wind className="w-4 h-4 text-white/80" />
                                <span className="font-semibold">{current.wind_speed_10m} <span className="text-[10px] font-normal opacity-80">km/h</span></span>
                            </div>
                            <div className="flex flex-col items-center gap-1 border-l border-white/10 border-r">
                                <Droplets className="w-4 h-4 text-white/80" />
                                <span className="font-semibold">{daily?.precipitation_probability_max?.[0] || 0}% <span className="text-[10px] font-normal opacity-80">Rain</span></span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-white/80 uppercase">High / Low</span>
                                <span className="font-semibold">{Math.round(daily?.temperature_2m_max[0])}° / {Math.round(daily?.temperature_2m_min[0])}°</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white">
                    {/* Hourly Forecast Section */}
                    <div className="p-4 border-b border-gray-50">
                        <h5 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Hourly
                        </h5>
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                            <div className="flex w-max space-x-5 px-1">
                                {nextHours.map((hour, i) => (
                                    <div key={i} className="flex flex-col items-center space-y-1.5 min-w-[3rem]">
                                        <span className="text-xs text-gray-400 font-medium">
                                            {format(new Date(hour.time), 'HH:mm')}
                                        </span>
                                        {hour.rainProb > 30 ? (
                                            <Cloud className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <Sun className="w-5 h-5 text-orange-400" />
                                        )}
                                        <span className="text-sm font-bold text-gray-800">{Math.round(hour.temp)}°</span>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>

                    {/* Daily Forecast Section */}
                    <div className="p-4 bg-gray-50/50">
                        <h5 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 3-Day Forecast
                        </h5>
                        <div className="space-y-3">
                            {dailyForecast.map((day, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="w-20 font-medium text-gray-700">
                                        {i === 0 ? 'Today' : format(new Date(day.date), 'EEEE')}
                                    </div>
                                    <div className="flex items-center gap-2 justify-center flex-1">
                                        {day.rainProb > 40 ? (
                                            <Cloud className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <Sun className="w-4 h-4 text-orange-400" />
                                        )}
                                        {day.rainProb > 0 && <span className="text-xs text-blue-500 font-medium">{day.rainProb}% rain</span>}
                                    </div>
                                    <div className="w-20 text-right font-semibold text-gray-800">
                                        {Math.round(day.maxTemp)}° <span className="text-gray-400 font-normal">/ {Math.round(day.minTemp)}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
