import React, { useState, useEffect } from 'react';
import { Bell, DollarSign, Calendar, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import VendorJobCard from '@/components/vendor/VendorJobCard';
import { BookingService } from '@/services/BookingService';
import { PaymentService } from '@/features/payments/services/PaymentService';
import { db } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";

export default function VendorLite() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        todayEarnings: 0,
        pendingJobs: 0,
        rating: 4.8
    });

    // State management
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await db.auth.getUser();

            if (user) {
                // 1. Fetch Wallet
                const wallet = await PaymentService.getWallet(user.id);
                // 2. Fetch Provider Profile to get the Provider ID
                const { data: provider } = await db.from('service_providers')
                    .select('id, business_name')
                    .eq('owner_id', user.id)
                    .single();

                if (wallet) {
                    setStats(prev => ({ ...prev, todayEarnings: wallet.balance }));
                }

                if (provider) {
                    // 3. Fetch Real Bookings/Requests
                    // Assuming 'service_requests' table has 'provider_id'
                    const { data: requests, error } = await db.from('service_requests')
                        .select('*, profiles:customer_id(full_name, phone_number)')
                        .eq('provider_id', provider.id)
                        .order('created_at', { ascending: false });

                    if (requests) {
                        setJobs(requests);
                        setStats(prev => ({
                            ...prev,
                            pendingJobs: requests.filter(j => j.status === 'pending').length
                        }));
                    }
                }
            } else {
                // Keep Demo Data for unauthenticated view
                setJobs([]);
            }

        } catch (error) {
            console.error("VendorLite fetch error:", error);
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
                        <p className="text-sm text-gray-500 font-medium">{t('provider.welcome')}</p>
                        <h1 className="text-2xl font-bold text-gray-900">Demo Provider 🌿</h1>
                        <p className="text-xs text-red-400 mt-1">{t('provider.demo_mode')}</p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-full relative">
                        <Bell className="w-6 h-6 text-gray-600" />
                        <span className="absolute top-1 end-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-blue-200 shadow-md">
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">{t('provider.today')}</span>
                        </div>
                        <div className="text-2xl font-bold">${stats.todayEarnings}</div>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-gray-800">
                        <div className="flex items-center gap-2 mb-1 text-gray-500">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">{t('provider.rating')}</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.rating}</div>
                    </div>
                </div>
            </div>

            {/* Feed Section */}
            <div className="px-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {t('provider.requests')} ({jobs.length})
                </h2>

                <div className="space-y-4">
                    {jobs.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            {t('provider.no_bookings')}
                            <br />
                            <span className="text-xs">{t('provider.create_booking_hint')}</span>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <VendorJobCard
                                key={job.id}
                                job={{
                                    id: job.id,
                                    serviceName: job.service_type || 'Service',
                                    customerName: job.profiles?.full_name || 'Guest',
                                    time: job.service_date ? `${job.service_date} @ ${job.start_time?.slice(0, 5)}` : 'TBD',
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
                    <Button variant="outline" className="w-full" onClick={fetchData}>{t('provider.refresh_jobs')}</Button>
                </div>
            </div>

            {/* Bottom Nav Mock */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-3 px-6 flex justify-between items-center max-w-md mx-auto text-gray-400">
                <div className="flex flex-col items-center gap-1 text-blue-600">
                    <Calendar className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{t('nav.home')}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{t('provider.today')}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                    <span className="text-[10px] font-medium">{t('nav.profile')}</span>
                </div>
            </div>
        </div>
    );
}
