import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-lg">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline Mode</span>
            </div>
        </div>
    );
}
