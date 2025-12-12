import React, { useState, useEffect } from 'react';
import { Bell, DollarSign, Calendar, Star } from 'lucide-react';
import VendorJobCard from '@/components/vendor/VendorJobCard';
import { BookingService } from '@/services/BookingService';
import { PaymentService } from '@/services/PaymentService';
import { db } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";

export default function VendorLite() {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        todayEarnings: 0,
        pendingJobs: 0,
        rating: 4.8
    });

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock provider ID for MVP - in real app would come from auth context
    const PROVIDER_ID = 'e6eb8c2e-41d3-45c1-9657-236274438136';
    // We need the ACTUAL user ID for the wallet.
    // For this demo to work visually, we'll fetch the current user's wallet.
    // If we are 'demoing' as a provider, we assume the logged in user IS the provider.

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Bookings
            // setJobs([]);

            // 2. Fetch Wallet
            // We need the current user ID
            const { data: { user } } = await db.auth.getUser();
            if (user) {
                const wallet = await PaymentService.getWallet(user.id);
                if (wallet) {
                    setStats(prev => ({ ...prev, todayEarnings: wallet.balance }));
                }
            }

            // REAL IMPLEMENTATION TODO: Get provider_id from logged in user profile.
            // For now, let's just use an empty list if we don't have an ID, or try to fetch one.
            // Actually, let's just fetch all bookings from the DB for the purpose of the demo dashboard if we can't find a provider.
            // But we can't.

            // Let's rely on the user having created a booking for a provider.
            // We can fetch the first provider from the DB to be safe
            // But I can't easily do that here without importing another service.

            setJobs([]); // Default to empty

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            await BookingService.updateBookingStatus(id, 'confirmed');

            // Optimistic update
            const job = jobs.find(j => j.id === id);
            setJobs(jobs.map(j => j.id === id ? { ...j, status: 'confirmed' } : j));

            if (job) {
                setStats(prev => ({ ...prev, todayEarnings: prev.todayEarnings + (Number(job.price) || 0) }));
            }

            toast({
                title: "Job Accepted! ✅",
                description: `You confirmed the booking.`
            });
        } catch (e) {
            toast({ title: "Error", description: "Failed to accept job", variant: "destructive" });
        }
    };

    const handleReject = async (id) => {
        try {
            await BookingService.updateBookingStatus(id, 'cancelled');
            setJobs(jobs.filter(j => j.id !== id));
            toast({
                title: "Job Declined",
                description: "Booking marked as cancelled."
            });
        } catch (e) {
            toast({ title: "Error", description: "Failed to reject job", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto border-x border-gray-200 shadow-xl">
            {/* Mobile Header */}
            <div className="bg-white px-6 py-8 rounded-b-3xl shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Good Morning,</p>
                        <h1 className="text-2xl font-bold text-gray-900">Demo Provider 🌿</h1>
                        <p className="text-xs text-red-400 mt-1">*Demo Mode: No Auth Linked*</p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-full relative">
                        <Bell className="w-6 h-6 text-gray-600" />
                        <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-blue-200 shadow-md">
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Today</span>
                        </div>
                        <div className="text-2xl font-bold">${stats.todayEarnings}</div>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-gray-800">
                        <div className="flex items-center gap-2 mb-1 text-gray-500">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">Rating</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.rating}</div>
                    </div>
                </div>
            </div>

            {/* Feed Section */}
            <div className="px-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Requests ({jobs.length})
                </h2>

                <div className="space-y-4">
                    {jobs.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            No bookings found.
                            <br />
                            <span className="text-xs">Create a booking as a user to see it here!</span>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <VendorJobCard
                                key={job.id}
                                job={{
                                    id: job.id,
                                    serviceName: job.service_type || 'Service',
                                    customerName: job.profiles?.full_name || 'Guest',
                                    time: `${job.service_date} @ ${job.start_time?.slice(0, 5)}`,
                                    price: job.price || 0,
                                    location: 'Samui',
                                    status: job.status
                                }}
                                onAccept={() => handleAccept(job.id)}
                                onReject={() => handleReject(job.id)}
                            />
                        ))
                    )}
                </div>

                <div className="mt-8">
                    <Button variant="outline" className="w-full" onClick={fetchData}>Refresh Jobs</Button>
                </div>
            </div>

            {/* Bottom Nav Mock */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-3 px-6 flex justify-between items-center max-w-md mx-auto text-gray-400">
                <div className="flex flex-col items-center gap-1 text-blue-600">
                    <Calendar className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Home</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Earnings</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                    <span className="text-[10px] font-medium">Profile</span>
                </div>
            </div>
        </div>
    );
}
