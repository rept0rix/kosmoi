import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isSameDay, parseISO, getHours } from 'date-fns';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CalendarView() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user, currentDate]);

    async function fetchBookings() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('provider_id', user.id)
                .gte('service_date', format(startDate, 'yyyy-MM-dd'))
                .lte('service_date', format(endDate, 'yyyy-MM-dd'));

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    }

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(subDays(currentDate, 7));
    const today = () => setCurrentDate(new Date());

    const getBookingsForCell = (day, hour) => {
        return bookings.filter(booking => {
            const bookingDate = parseISO(booking.service_date);
            const bookingHour = parseInt(booking.start_time.split(':')[0], 10); // Assume HH:MM:SS format
            return isSameDay(bookingDate, day) && bookingHour === hour;
        });
    };

    if (loading && !bookings.length) { // Initial load
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                    <p className="text-gray-500">Manage your upcoming appointments</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevWeek}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium min-w-[140px] text-center">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </span>
                    <Button variant="outline" size="icon" onClick={nextWeek}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" onClick={today}>Today</Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header Row */}
                        <div className="grid grid-cols-8 border-b">
                            <div className="p-4 text-center text-sm font-medium text-gray-500 border-r bg-gray-50">
                                Time
                            </div>
                            {weekDays.map(day => (
                                <div key={day.toString()} className={`p-4 text-center border-r last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <div className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                                        {format(day, 'EEE')}
                                    </div>
                                    <div className={`text-xs mt-1 ${isSameDay(day, new Date()) ? 'text-blue-500' : 'text-gray-500'}`}>
                                        {format(day, 'MMM d')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Time Grid */}
                        <div className="divide-y">
                            {hours.map(hour => (
                                <div key={hour} className="grid grid-cols-8 min-h-[80px]">
                                    {/* Time Label */}
                                    <div className="p-2 text-xs text-gray-500 text-center border-r flex flex-col justify-start pt-3 bg-gray-50/50">
                                        {`${hour}:00`}
                                    </div>

                                    {/* Days Columns */}
                                    {weekDays.map(day => {
                                        const cellBookings = getBookingsForCell(day, hour);
                                        return (
                                            <div key={`${day}-${hour}`} className="border-r last:border-r-0 p-1 relative hover:bg-gray-50 transition-colors">
                                                {cellBookings.map(booking => (
                                                    <div key={booking.id} className="bg-blue-100 border-l-2 border-blue-600 p-1.5 rounded text-xs mb-1 cursor-pointer hover:bg-blue-200 transition-colors truncate">
                                                        <div className="font-semibold text-blue-800 truncate">
                                                            {booking.service_type || 'Service'}
                                                        </div>
                                                        <div className="text-blue-600 truncate">
                                                            {/* We would ideally look up user name here if we joined or fetched profile */}
                                                            Customer
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
