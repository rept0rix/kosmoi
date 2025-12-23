import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, Luggage } from 'lucide-react';

export default function Organizer() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-24">
            <h1 className="text-2xl font-bold font-['Outfit'] mb-6 text-slate-800 dark:text-white">Organizer</h1>

            <div className="space-y-4">
                <GlassCard className="p-6 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                        <Luggage size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Trip Planner</h3>
                        <p className="text-sm text-slate-500">Manage your itinerary</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full text-purple-600 dark:text-purple-400">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">My Calendar</h3>
                        <p className="text-sm text-slate-500">Upcoming events & bookings</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Tasks</h3>
                        <p className="text-sm text-slate-500">To-do list & reminders</p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
