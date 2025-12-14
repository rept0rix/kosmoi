import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingService } from '@/services/BookingService';
import { Loader2, CheckCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { DayPicker } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import 'react-day-picker/dist/style.css';

export default function BookingDialog({ open, onOpenChange, provider, onBookingConfirmed }) {
    const [step, setStep] = useState('date'); // date | time | confirm | success
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingBooking, setLoadingBooking] = useState(false);

    const { toast } = useToast();
    const { user, navigateToLogin } = useAuth();

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('date');
                setSelectedDate(null);
                setSelectedTime(null);
                setAvailableSlots([]);
            }, 300);
        }
    }, [open]);

    const handleDateSelect = async (date) => {
        if (!date) return;
        setSelectedDate(date);
        setStep('time');
        await fetchSlots(date);
    };

    const fetchSlots = async (date) => {
        setLoadingSlots(true);
        try {
            // Use local service which checks existing bookings
            const slots = await BookingService.getAvailableSlots(date, provider.id);
            setAvailableSlots(slots);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Could not load available slots.",
                variant: "destructive"
            });
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!user) {
            toast({
                title: "Login Required",
                description: "You must be logged in to book an appointment.",
                variant: "destructive"
            });
            // Ideally navigate to login or open login modal
            // navigateToLogin(); // Might be too aggressive if it redirects page
            return;
        }

        setLoadingBooking(true);
        try {
            const booking = await BookingService.createBooking({
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime,
                providerId: provider.id,
                userId: user.id,
                serviceName: provider.category || "Consultation" // Default or passed prop
            });

            setStep('success');
            if (onBookingConfirmed) {
                onBookingConfirmed(booking);
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Booking Failed",
                description: error.message || "Something went wrong.",
                variant: "destructive"
            });
        } finally {
            setLoadingBooking(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'success' ? 'Booking Confirmed!' : `Book with ${provider?.business_name || 'Provider'}`}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'date' && 'Pick a date for your service.'}
                        {step === 'time' && `Available times for ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}.`}
                        {step === 'confirm' && 'Review details and confirm.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 min-h-[300px] flex flex-col items-center">

                    {/* Step 1: Date Selection */}
                    {step === 'date' && (
                        <div className="flex justify-center">
                            <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={{ before: new Date() }} // Disable past dates
                                modifiersClassNames={{
                                    selected: 'bg-blue-600 text-white rounded-full hover:bg-blue-700'
                                }}
                            />
                        </div>
                    )}

                    {/* Step 2: Time Selection */}
                    {step === 'time' && (
                        <div className="w-full">
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 justify-center">
                                <CalendarIcon className="w-4 h-4" />
                                {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
                            </div>

                            {loadingSlots ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                                    {availableSlots.map(time => (
                                        <Button
                                            key={time}
                                            variant="outline"
                                            className="hover:bg-blue-50 hover:border-blue-200"
                                            onClick={() => handleTimeSelect(time)}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    No slots available for this date.
                                    <Button variant="link" onClick={() => setStep('date')} className="block mx-auto mt-2">Pick another date</Button>
                                </div>
                            )}

                            {!loadingSlots && (
                                <Button variant="ghost" size="sm" onClick={() => setStep('date')} className="mt-4">
                                    Back
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 'confirm' && (
                        <div className="w-full space-y-6">
                            <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                                <div className="flex items-center gap-3 text-blue-900">
                                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-blue-900">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium">{selectedTime}</span>
                                </div>
                                <div className="flex items-center gap-3 text-blue-900">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">$</div>
                                    <span className="font-medium">{provider?.category || 'Service'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button onClick={handleConfirm} disabled={loadingBooking} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                                    {loadingBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"}
                                </Button>
                                <Button variant="ghost" onClick={() => setStep('time')} disabled={loadingBooking}>
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">You're all set!</h3>
                                <p className="text-gray-500 mt-2">
                                    We sent a confirmation to your email.
                                </p>
                            </div>
                            <Button onClick={() => onOpenChange(false)} className="w-full mt-4">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
