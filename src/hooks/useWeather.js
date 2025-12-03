import { useQuery } from "@tanstack/react-query";

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
export const getWeatherDescription = (code) => {
    const codes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    };
    return codes[code] || "Unknown";
};

export const useWeather = (lat = 9.5120, lng = 100.0136) => {
    return useQuery({
        queryKey: ["weather", lat, lng],
        queryFn: async () => {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok`
            );
            if (!response.ok) {
                throw new Error("Weather fetch failed");
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};
