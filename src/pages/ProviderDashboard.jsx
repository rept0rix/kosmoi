import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MapPin from 'lucide-react/icons/map-pin';
import Navigation from 'lucide-react/icons/navigation';
import Clock from 'lucide-react/icons/clock';
import CreditCard from 'lucide-react/icons/credit-card';
import Power from 'lucide-react/icons/power';
import Star from 'lucide-react/icons/star';
import Zap from 'lucide-react/icons/zap';
import LayoutGrid from 'lucide-react/icons/layout-grid';
import MapIcon from 'lucide-react/icons/map';
import Trash2 from 'lucide-react/icons/trash-2';
import Edit from 'lucide-react/icons/edit';
import CalendarIcon from 'lucide-react/icons/calendar';
import ImageIcon from 'lucide-react/icons/image';
import Loader2 from 'lucide-react/icons/loader-2';
import GoogleMap from '@/components/GoogleMap';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import PricingModal from '@/components/payments/PricingModal';
import { StripeService } from '@/services/payments/StripeService';
import { MarketplaceService } from '@/services/MarketplaceService';
import { ProductCard } from '@/components/marketplace/ProductCard';
const CalendarView = React.lazy(() => import('@/pages/vendor/CalendarView')); // Import Calendar Component
const EditProfileDialog = React.lazy(() => import('@/components/dashboard/EditProfileDialog'));
const StatsOverview = React.lazy(() => import('@/components/dashboard/StatsOverview'));

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

const ServicesView = ({ provider }) => {
    if (!provider?.price_packages || provider.price_packages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No services listed</p>
                <p className="text-sm">Edit your profile to add service packages.</p>
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {provider.price_packages.map((pkg, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative group hover:border-violet-500/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white text-lg">{pkg.title}</h3>
                        <Badge variant="outline" className="border-green-500/20 text-green-400 bg-green-500/10">
                            {pkg.price}
                        </Badge>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{pkg.description}</p>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                            Package
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
};

const GalleryView = ({ provider }) => {
    if (!provider?.images || provider.images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No images uploaded</p>
                <p className="text-sm">Add photos to your gallery in Edit Profile.</p>
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
            {provider.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
            ))}
        </div>
    );
};

// Lazy loaded components above

// ... (existing helper function MyListingsView unchanged, assume it is here) ...

export default function ProviderDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [incomingJob, setIncomingJob] = useState(null);
    const [viewMode, setViewMode] = useState('map'); // 'map' | 'services' | 'gallery' | 'calendar' | 'stats'
    const { toast } = useToast();
    const [providerProfile, setProviderProfile] = useState(null);

    // Pricing Modal State
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        StripeService.getSubscription().then(setSubscription);
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Optimized: Single query with OR condition instead of sequential lookups
            const { data, error } = await supabase
                .from('service_providers')
                .select('*')
                .or(`id.eq.${user.id},owner_id.eq.${user.id}`)
                .maybeSingle();

            if (data) setProviderProfile(data);
            if (error) console.error("Error fetching profile:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // 1. Get Location (Existing)
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

    // 2. Subscribe to Incoming Jobs (Smart Dispatch)
    useEffect(() => {
        let channel;

        const subscribeToJobs = async () => {
            if (!isOnline || !providerProfile?.category) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            console.log(`[Smart Dispatch] Subscribing to category: ${providerProfile.category}`);

            /** @type {any} */
            const newChannel = supabase.channel('dispatch-channel');

            newChannel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'service_requests',
                    filter: `category=eq.${providerProfile.category}` // Smart Filter
                },
                (payload) => {
                    console.log('[Smart Dispatch] New Job:', payload);
                    const job = payload.new;

                    // Client-side status check since we can only filter by one column in Realtime
                    if (job.status !== 'pending') return;

                    setIncomingJob({
                        id: job.id,
                        customer: 'New Customer', // This would ideally be fetched via user_id
                        service: job.service_type || job.category,
                        distance: '2.4 km', // Mock distance
                        estTime: '5 mins',
                        price: `${job.price || 0} THB`,
                        location: { lat: job.location_lat, lng: job.location_lng },
                        status: job.status
                    });

                    toast({
                        title: "New Job Request! 🔔",
                        description: `${job.service_type || 'Service'} nearby.`
                    });
                }
            ).subscribe();

            channel = newChannel;
        };

        if (isOnline && providerProfile) {
            subscribeToJobs();
        }

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [isOnline, providerProfile]); // Re-subscribe if online status or profile changes

    const toggleOnlineStatus = async (val) => {
        setIsOnline(val);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('service_providers')
                .update({
                    is_online: val,
                    last_seen: new Date().toISOString(),
                    ...(userLocation ? {
                        current_lat: userLocation.lat,
                        current_lng: userLocation.lng
                    } : {})
                })
                .eq('owner_id', user.id);

            if (error) {
                console.error("Failed to update status", error);
                toast({ variant: "destructive", title: "Connection Error", description: "Could not sync status." });
                setIsOnline(!val);
            } else {
                if (val) toast({ title: "You are Online 🟢", description: "Waiting for requests..." });
                else toast({ title: "You are Offline ⚫", description: "You will not receive jobs." });
            }
        } catch (e) {
            console.error(e);
            setIsOnline(!val);
        }
    };

    const handleAcceptJob = async () => {
        if (!incomingJob || !providerProfile) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Update Database
            const { error } = await supabase
                .from('service_requests')
                .update({
                    status: 'accepted',
                    provider_id: providerProfile.id, // Link to this provider
                    updated_at: new Date().toISOString()
                })
                .eq('id', incomingJob.id);

            if (error) throw error;

            // 2. Update UI
            setIncomingJob(null);
            toast({
                title: "Job Accepted! 🚀",
                description: "Navigating to customer location...",
                className: "bg-green-500 text-white"
            });

            // In a real app, this would trigger navigation or state change to 'active-job' mode

        } catch (error) {
            console.error("Failed to accept job:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not accept job. It may have been taken." });
        }
    };

    // Earnings State
    const [dailyEarnings, setDailyEarnings] = useState(0);

    // 3. Fetch Real Earnings (Wallet Integration)
    useEffect(() => {
        const fetchEarnings = async () => {
            if (!providerProfile?.owner_id) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // A. Get Wallet
            const { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', providerProfile.owner_id)
                .single();

            if (walletError || !wallet) {
                // If checking for earnings and no wallet, they might just have 0 earnings or need initialization. 
                // We'll just ignore for now or console.debug.
                console.debug("No wallet found for provider, skipping earnings fetch.");
                return;
            }

            // B. Get Transactions
            const { data, error } = await supabase
                .from('transactions')
                .select('amount')
                .eq('wallet_id', wallet.id)
                .eq('type', 'earning')
                .eq('status', 'completed')
                .gte('created_at', today.toISOString());

            if (error) {
                console.error("Error fetching earnings:", error);
                return;
            }

            const total = data.reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0);
            setDailyEarnings(total);
        };

        fetchEarnings();
    }, [providerProfile]);

    return (
        <div className="h-[calc(100vh-60px)] relative flex flex-col bg-slate-900 overflow-hidden">

            {/* --- Top Bar (Status) --- */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">

                    {/* Left: Status & View Toggle */}
                    <div className="flex flex-col gap-3 mt-10">
                        {/* Business Header */}
                        {providerProfile && (
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                                    {providerProfile.logo_url ? (
                                        <img src={providerProfile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                            {providerProfile.business_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-white font-bold text-lg leading-none shadow-black drop-shadow-md">
                                        {providerProfile.business_name || 'My Business'}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <Badge className={`h-5 text-[10px] px-1.5 backdrop-blur-md ${isOnline ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                                        </Badge>
                                        <Switch
                                            checked={isOnline}
                                            onCheckedChange={toggleOnlineStatus}
                                            className="scale-75 origin-left data-[state=checked]:bg-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">


                            {/* Edit Profile Entry */}
                            {providerProfile && (
                                <React.Suspense fallback={null}>
                                    <EditProfileDialog provider={providerProfile} onUpdate={fetchProfile} />
                                </React.Suspense>
                            )}
                        </div>

                        {/* View Switcher */}
                        <div className="flex bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 w-fit">
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 px-3 rounded-md ${viewMode === 'map' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => setViewMode('map')}
                            >
                                <MapIcon className="w-4 h-4 mr-2" /> Dispatch
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 px-3 rounded-md ${viewMode === 'calendar' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => setViewMode('calendar')}
                            >
                                <CalendarIcon className="w-4 h-4 mr-2" /> Schedule
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 px-3 rounded-md ${viewMode === 'services' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => setViewMode('services')}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" /> Services
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 px-3 rounded-md ${viewMode === 'gallery' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => setViewMode('gallery')}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" /> Gallery
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 px-3 rounded-md ${viewMode === 'stats' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => setViewMode('stats')}
                            >
                                <Zap className="w-4 h-4 mr-2" /> Analytics
                            </Button>
                        </div>
                    </div>

                    {/* Right: Earnings & Pro Badge */}
                    <div className="flex flex-col gap-2 mt-10 items-end">
                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-2 px-4 border border-white/10 text-right">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Today's Earnings</p>
                            <p className="text-xl font-bold text-white">฿ {dailyEarnings.toLocaleString()}</p>
                        </div>

                        {!subscription && (
                            <PricingModal trigger={
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-900/20 border border-white/10"
                                >
                                    <Zap className="w-4 h-4 mr-1 text-yellow-300 fill-yellow-300" />
                                    Upgrade to Pro
                                </Button>
                            } />
                        )}
                        {subscription && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 backdrop-blur-md">
                                <Star className="w-3 h-3 mr-1 fill-blue-300" /> Pro Partner
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Main Content Layer --- */}
            <div className="flex-1 w-full h-full pt-32 sm:pt-36">
                {viewMode === 'map' && (
                    <div className="w-full h-full relative">
                        <div className="absolute inset-0">
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
                                    options={{
                                        disableDefaultUI: true,
                                        styles: []
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <MapPin className="animate-bounce mr-2" /> Locating GPS...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'services' && (
                    <div className="h-full bg-slate-900 overflow-y-auto pt-4">
                        <ServicesView provider={providerProfile} />
                    </div>
                )}

                {viewMode === 'gallery' && (
                    <div className="h-full bg-slate-900 overflow-y-auto pt-4">
                        <GalleryView provider={providerProfile} />
                    </div>
                )}

                {viewMode === 'calendar' && (
                    <div className="h-full bg-slate-900 overflow-y-auto pt-4">
                        <React.Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
                            <CalendarView />
                        </React.Suspense>
                    </div>
                )}

                {viewMode === 'stats' && (
                    <div className="h-full bg-slate-900 overflow-y-auto p-6 pt-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Performance Analytics</h2>
                        <React.Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
                            <StatsOverview provider={providerProfile} />
                        </React.Suspense>

                        {/* More analytics placeholders or charts can be added here */}
                        <div className="p-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500">
                            More insights coming soon...
                        </div>
                    </div>
                )}
            </div>

            {/* --- Bottom Sheet (Incoming Job) --- */}
            <AnimatePresence>
                {incomingJob && incomingJob.status !== 'accepted' && viewMode === 'map' && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 20 }}
                        className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6 pb-8 border-t border-white/10"
                    >
                        {/* ... (existing job card content) ... */}
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6" />
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <Badge variant="outline" className="mb-2 border-purple-500 text-purple-600 bg-purple-50">New Request</Badge>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{incomingJob.service}</h2>
                                <p className="text-slate-500 flex items-center gap-2"><MapPin size={16} /> {incomingJob.distance} • {incomingJob.estTime} away</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{incomingJob.price}</p>
                                <p className="text-xs text-slate-400">Fixed Price</p>
                            </div>
                        </div>
                        <Button size="lg" className="w-full text-lg h-14 bg-gradient-to-r from-green-600 to-emerald-600" onClick={handleAcceptJob}>
                            <Navigation className="mr-2" size={20} /> Accept & Navigate
                        </Button>
                        <button className="w-full mt-3 py-3 text-slate-400 text-sm" onClick={() => setIncomingJob(null)}>Decline Request</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Accepted Job Sheet would go here similarly */}

        </div >
    );
}
