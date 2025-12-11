import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CalendarView from './CalendarView';
import { BookingService } from '@/services/BookingService';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function BookingDialog({ open, onOpenChange, providerId, serviceName = "Consultation", onBookingConfirmed }) {
    const [step, setStep] = useState('select'); // select | confirming | success
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
    };

    const handleConfirmBooking = async () => {
        if (!selectedSlot) return;
        setLoading(true);
        try {
            const booking = await BookingService.createBooking({
                providerId,
                serviceName,
                date: selectedSlot.date,
                time: selectedSlot.time
            });

            setStep('success');
            if (onBookingConfirmed) {
                onBookingConfirmed(booking);
            }
        } catch (e) {
            console.error("Booking failed", e);
            toast({
                title: "Booking Failed",
                description: "Could not confirm booking. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after transition
        setTimeout(() => {
            setStep('select');
            setSelectedSlot(null);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{step === 'success' ? 'Booking Confirmed!' : `Book ${serviceName}`}</DialogTitle>
                    {step === 'select' && <DialogDescription>Select a date and time for your appointment.</DialogDescription>}
                </DialogHeader>

                {step === 'select' && (
                    <div className="py-4">
                        <CalendarView
                            providerId={providerId}
                            onSlotSelect={handleSlotSelect}
                            className="border-0 shadow-none p-0"
                        />
                        {selectedSlot && (
                            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg flex justify-between items-center">
                                <span>Selected: <strong>{selectedSlot.time}</strong> on {selectedSlot.date.toLocaleDateString()}</span>
                                <Button onClick={handleConfirmBooking} disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <p className="text-center text-gray-600">
                            Your appointment for <strong>{serviceName}</strong> is confirmed for<br />
                            {selectedSlot?.date.toLocaleDateString()} at {selectedSlot?.time}.
                        </p>
                        <Button onClick={handleClose} className="w-full">Done</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
