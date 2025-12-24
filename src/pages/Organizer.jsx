import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, Luggage } from 'lucide-react';

export default function Organizer() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-24 font-sans animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold font-['Outfit'] mb-6 text-slate-800 dark:text-white text-start">Organizer</h1>

            <div className="space-y-4">
                {[
                    { title: 'Trip Planner', desc: 'Manage your itinerary', icon: Luggage, color: 'text-blue-600 bg-blue-100', delay: 'delay-[0ms]' },
                    { title: 'My Calendar', desc: 'Upcoming events & bookings', icon: Calendar, color: 'text-purple-600 bg-purple-100', delay: 'delay-[100ms]' },
                    { title: 'Tasks', desc: 'To-do list & reminders', icon: CheckSquare, color: 'text-green-600 bg-green-100', delay: 'delay-[200ms]' }
                ].map((item, idx) => (
                    <GlassCard
                        key={idx}
                        className={`p-6 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards ${item.delay}`}
                    >
                        <div className={`${item.color} dark:bg-opacity-20 p-3 rounded-full`}>
                            <item.icon size={24} />
                        </div>
                        <div className="text-start">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{item.title}</h3>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
