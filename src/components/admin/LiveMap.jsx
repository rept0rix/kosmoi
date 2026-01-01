import React, { useState, useEffect } from 'react';
import GoogleMap from '@/components/GoogleMap';
import { supabase } from '@/api/supabaseClient';
import { AdminService } from '@/services/AdminService';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LiveMap() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);

    // Initial Load
    useEffect(() => {
        const loadProviders = async () => {
            setLoading(true);
            const data = await AdminService.getBusinesses();
            if (data) {
                // Filter for those who might have location data, even if offline, but primarily we want online
                setProviders(data);
            }
            setLoading(false);
        };
        loadProviders();
    }, []);

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-live-map')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'service_providers'
                },
                (payload) => {
                    setProviders(current => {
                        const updated = payload.new;
                        return current.map(p => p.id === updated.id ? updated : p);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const onlineProviders = providers.filter(p => p.is_online && p.current_lat && p.current_lng);

    // Calculate center based on first online user or default to Samui
    const mapCenter = onlineProviders.length > 0
        ? { lat: onlineProviders[0].current_lat, lng: onlineProviders[0].current_lng }
        : { lat: 9.512017, lng: 100.013593 };

    return (
        <div className="h-[600px] w-full relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <GoogleMap
                center={mapCenter}
                zoom={12}
                height="100%"
                markers={onlineProviders.map(p => ({
                    lat: p.current_lat,
                    lng: p.current_lng,
                    title: p.business_name || 'Provider',
                    icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', // Drivers/Providers are blue
                    onClick: () => setSelectedProvider(p)
                }))}
                options={{
                    disableDefaultUI: false, // Allow zoom controls for admin
                }}
            />

            {/* Overlay Stats */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Card className="bg-black/60 backdrop-blur-md border-white/10 text-white p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold">{onlineProviders.length} Online</span>
                    </div>
                </Card>
            </div>

            {/* Provider Detail Overlay */}
            {selectedProvider && (
                <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80">
                    <Card className="bg-slate-900/90 backdrop-blur-xl border-white/10 text-white p-4 animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{selectedProvider.business_name}</h3>
                                <p className="text-sm text-slate-400 flex items-center gap-1">
                                    <User className="w-3 h-3" /> {selectedProvider.contact_email || 'No email'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProvider(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                x
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="bg-white/5 p-2 rounded text-center">
                                <p className="text-xs text-slate-500">Status</p>
                                <Badge variant="outline" className="mt-1 border-green-500 text-green-400">Online</Badge>
                            </div>
                            <div className="bg-white/5 p-2 rounded text-center">
                                <p className="text-xs text-slate-500">Last Seen</p>
                                <p className="text-xs font-mono mt-1">
                                    {selectedProvider.last_seen ? new Date(selectedProvider.last_seen).toLocaleTimeString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
