import React, { useState } from 'react';
import { Bell, DollarSign, Calendar, Star } from 'lucide-react';
import VendorJobCard from '@/components/vendor/VendorJobCard';
import { PaymentService } from '@/services/PaymentService';
import { useToast } from '@/components/ui/use-toast';

export default function VendorLite() {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        todayEarnings: 150.00,
        pendingJobs: 2,
        rating: 4.9
    });

    const [jobs, setJobs] = useState([
        {
            id: 'j1',
            serviceName: 'Deep Tissue Massage',
            customerName: 'Alice Watson',
            time: 'Today, 2:00 PM',
            price: 80,
            location: 'Villa #42, Chewang',
            status: 'pending'
        },
        {
            id: 'j2',
            serviceName: 'Private Chef (Dinner)',
            customerName: 'Robert K.',
            time: 'Tomorrow, 7:00 PM',
            price: 250,
            location: 'Coral Bay Resort',
            status: 'pending'
        }
    ]);

    const handleAccept = async (id) => {
        // Simulate API call
        const job = jobs.find(j => j.id === id);

        // Optimistic update
        setJobs(jobs.filter(j => j.id !== id));
        setStats(prev => ({ ...prev, todayEarnings: prev.todayEarnings + job.price }));

        // Mock credit update although this is a separate wallet
        await PaymentService.addCredits(job.price);

        toast({
            title: "Job Accepted! ✅",
            description: `You accepted ${job.serviceName}. Check your schedule.`
        });
    };

    const handleReject = (id) => {
        setJobs(jobs.filter(j => j.id !== id));
        toast({
            title: "Job Declined",
            description: "We'll find another provider for this request."
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto border-x border-gray-200 shadow-xl">
            {/* Mobile Header */}
            <div className="bg-white px-6 py-8 rounded-b-3xl shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Good Morning,</p>
                        <h1 className="text-2xl font-bold text-gray-900">Sarah Spa 🌿</h1>
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
                    New Requests ({jobs.length})
                </h2>

                <div className="space-y-4">
                    {jobs.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            No new requests right now.
                            <br />
                            Relax! ☕
                        </div>
                    ) : (
                        jobs.map(job => (
                            <VendorJobCard
                                key={job.id}
                                job={job}
                                onAccept={handleAccept}
                                onReject={handleReject}
                            />
                        ))
                    )}
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
