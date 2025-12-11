import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
import { BookingService } from '@/services/BookingService';

export default function CalendarView({ providerId, onSlotSelect, className }) {
    const [selectedDate, setSelectedDate] = useState();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleDateSelect = async (date) => {
        setSelectedDate(date);
        if (date) {
            setLoading(true);
            try {
                const availableSlots = await BookingService.getAvailableSlots(date, providerId);
                setSlots(availableSlots);
            } catch (e) {
                console.error("Failed to fetch slots", e);
            } finally {
                setLoading(false);
            }
        } else {
            setSlots([]);
        }
    };

    return (
        <Card className={`w-full max-w-md ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Select Date</span>
                    {selectedDate && <Badge variant="outline">{format(selectedDate, 'MMM d, yyyy')}</Badge>}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
                <div className="border rounded-md p-2">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={{ before: new Date() }}
                        className="m-0"
                    />
                </div>

                {selectedDate && (
                    <div className="flex-1 flex flex-col gap-2">
                        <h4 className="font-medium text-sm text-gray-500 mb-2">Available Slots</h4>
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : slots.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {slots.map(slot => (
                                    <Button
                                        key={slot}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onSlotSelect && onSlotSelect({ date: selectedDate, time: slot })}
                                        className="text-xs"
                                    >
                                        {slot}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No slots available.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
