import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, CreditCard, Power } from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';

// Mock Incoming Job
const MOCK_JOB = {
    id: 'job-123',
    customer: 'Sarah Connor',
    service: 'AC Repair (Leaking)',
    distance: '2.4 km',
    estTime: '15 mins',
    price: '850 THB',
    location: { lat: 9.512, lng: 100.052 } // Chaweng area mock
};

export default function ProviderDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [incomingJob, setIncomingJob] = useState(null);
    const { toast } = useToast();

    // 1. Get Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error("Location Error:", error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // 2. Subscribe to Incoming Jobs (Realtime)
    useEffect(() => {
        let channel;

        const subscribeToJobs = async () => {
            if (!isOnline) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get provider ID first (assuming 1:1 mapping for simplicity or user_id check)
            // Ideally we subscribe to "service_requests" where provider_id matches ours
            // But strict RLS might prevent seeing "INSERT" if we are not the creator?
            // Actually, if row is inserted with our provider_id, and RLS allows select, we might get it.
            // For "Uber-like" broadcast, typically requests are "broadcast" to all nearby.
            // But here we implement "Assigned" model for simplicity as per plan.

            console.log("Subscribing to service_requests...");

            channel = supabase
                .channel('dispatch-channel')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'service_requests',
                        filter: `status=eq.pending` // Listen for any pending request (Broadcast mode would need ignoring provider_id initially)
                    },
                    (payload) => {
                        console.log('New Job Received:', payload);
                        const job = payload.new;
                        setIncomingJob({
                            id: job.id,
                            customer: 'New Customer', // We'd need to fetch name
                            service: job.service_type || 'General Service',
                            distance: 'Calculating...',
                            estTime: '5 mins',
                            price: `${job.price || 0} THB`,
                            location: { lat: job.location_lat, lng: job.location_lng },
                            status: 'pending'
                        });
                        toast({
                            title: "New Job Request! 🔔",
                            description: `${job.service_type || 'Service'} nearby.`
                        });
                    }
                )
                .subscribe();
        };

        if (isOnline) {
            subscribeToJobs();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [isOnline]);

    const toggleOnlineStatus = async (val) => {
        // Optimistic UI update
        setIsOnline(val);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Should be protected route anyway

            // Update DB
            const { error } = await supabase
                .from('service_providers')
                .update({
                    is_online: val,
                    last_seen: new Date().toISOString(),
                    // Optionally update location if available
                    ...(userLocation ? {
                        current_lat: userLocation.lat,
                        current_lng: userLocation.lng
                    } : {})
                })
                .eq('user_id', user.id);

            if (error) {
                console.error("Failed to update status", error);
                toast({ variant: "destructive", title: "Connection Error", description: "Could not sync status." });
                setIsOnline(!val); // Revert
            } else {
                if (val) toast({ title: "You are Online 🟢", description: "Waiting for requests..." });
                else toast({ title: "You are Offline ⚫", description: "You will not receive jobs." });
            }
        } catch (e) {
            console.error(e);
            setIsOnline(!val);
        }
    };

    const handleAcceptJob = () => {
        toast({
            title: "Job Accepted! 🚀",
            description: `Navigating to ${incomingJob.customer}...`,
        });
        setIncomingJob(prev => ({ ...prev, status: 'accepted' }));
        // Here we would create a real 'booking' record
    };

    return (
        <div className="h-[calc(100vh-60px)] relative flex flex-col bg-slate-900 overflow-hidden">

            {/* --- Top Bar (Status) --- */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <div className="bg-black/40 backdrop-blur-md rounded-full mt-10 p-1 pl-4 pr-1 flex items-center gap-3 border border-white/10">
                        <span className={`font-semibold ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <Switch
                            checked={isOnline}
                            onCheckedChange={toggleOnlineStatus}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                    <div className="bg-black/40 mt-10 backdrop-blur-md rounded-xl p-2 px-4 border border-white/10 text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Today's Earnings</p>
                        <p className="text-xl font-bold text-white">฿ 1,450</p>
                    </div>
                </div>
            </div>

            {/* --- Map Layer --- */}
            <div className="flex-1 w-full h-full">
                {userLocation ? (
                    <GoogleMap
                        center={userLocation}
                        zoom={15}
                        height="100%"
                        userLocation={userLocation}
                        markers={incomingJob ? [{
                            lat: incomingJob.location.lat,
                            lng: incomingJob.location.lng,
                            title: "Job Location",
                            icon: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png"
                        }] : []}
                        // Minimal UI for driver mode
                        options={{
                            disableDefaultUI: true,
                            styles: [ /* Dark Mode Map Style could go here */]
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <MapPin className="animate-bounce mr-2" /> Locating GPS...
                    </div>
                )}
            </div>

            {/* --- Bottom Sheet (Incoming Job) --- */}
            <AnimatePresence>
                {incomingJob && incomingJob.status !== 'accepted' && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 20 }}
                        className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6 pb-8 border-t border-white/10"
                    >
                        {/* Handle Bar */}
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6" />

                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <Badge variant="outline" className="mb-2 border-purple-500 text-purple-600 bg-purple-50">
                                    New Request
                                </Badge>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                    {incomingJob.service}
                                </h2>
                                <p className="text-slate-500 flex items-center gap-2">
                                    <MapPin size={16} /> {incomingJob.distance} • {incomingJob.estTime} away
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {incomingJob.price}
                                </p>
                                <p className="text-xs text-slate-400">Fixed Price</p>
                            </div>
                        </div>

                        {/* Customer Info (Brief) */}
                        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                {incomingJob.customer[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{incomingJob.customer}</p>
                                <p className="text-xs text-slate-500">4.9 ⭐ (12 reviews)</p>
                            </div>
                        </div>

                        {/* Action Slider Button */}
                        <Button
                            size="lg"
                            className="w-full text-lg h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-900/20"
                            onClick={handleAcceptJob}
                        >
                            <Navigation className="mr-2" size={20} /> Accept & Navigate
                        </Button>

                        <button
                            className="w-full mt-3 py-3 text-slate-400 text-sm hover:text-slate-600"
                            onClick={() => setIncomingJob(null)}
                        >
                            Decline Request
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Bottom Sheet (ACCEPTED State) --- */}
            <AnimatePresence>
                {incomingJob && incomingJob.status === 'accepted' && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        className="absolute bottom-0 left-0 right-0 z-30 bg-indigo-900 text-white rounded-t-3xl p-6 pb-12"
                    >
                        <h3 className="text-xl font-bold mb-2">Navigating to {incomingJob.customer}</h3>
                        <p className="text-indigo-200 mb-6">Don't forget to start the timer when you arrive.</p>
                        <Button variant="secondary" className="w-full" onClick={() => setIncomingJob(null)}>
                            Complete Job (Demo)
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
