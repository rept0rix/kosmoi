import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from "@/features/auth/context/AuthContext";
import { BookingService } from '@/services/BookingService';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MyBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const language = i18n.language;

    useEffect(() => {
        if (user) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await BookingService.getUserBookings(user.id);
            setBookings(data || []);
        } catch (error) {
            console.error(error);
            toast({ title: t('error'), description: t('my_bookings.load_error'), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!confirm(t('my_bookings.cancel_confirm'))) return;

        try {
            await BookingService.cancelBooking(bookingId);
            toast({ title: t('my_bookings.cancel_success') });
            fetchBookings(); // Refresh list
        } catch (error) {
            console.error(error);
            toast({ title: t('error'), description: t('my_bookings.cancel_error'), variant: "destructive" });
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-amber-500" />
                <h2 className="text-xl font-semibold">{t('favorites.loginRequired')}</h2>
                <p className="text-gray-500">{t('my_bookings.login_desc') || t('my_reviews.login_desc')}</p>
                <Button onClick={() => navigate('/login')}>{t('login')}</Button>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">{t('my_bookings.title')}</h1>
            <p className="text-gray-500 mb-8">{t('my_bookings.subtitle')}</p>

            {bookings.length === 0 ? (
                <Card className="text-center py-12 bg-slate-50 border-dashed">
                    <CardContent className="flex flex-col items-center gap-4">
                        <Calendar className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium text-gray-600">{t('my_bookings.no_bookings')}</p>
                        <Button variant="outline" onClick={() => navigate('/board-room')}>{t('my_bookings.book_appointment')}</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                <div className="bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center justify-center min-w-[150px] border-e border-slate-200 dark:border-slate-700">
                                    <span className="text-2xl font-bold">{new Date(booking.service_date).getDate()}</span>
                                    <span className="text-sm font-medium uppercase text-gray-500">
                                        {new Date(booking.service_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold">{booking.service_type || t('my_bookings.service_appointment')}</h3>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{booking.service_providers?.business_name || t('my_bookings.service_provider')}</span>
                                            </div>
                                        </div>
                                        <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">
                                            {t(`status.${booking.status}`) || booking.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-6 flex items-center border-s border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleCancel(booking.id)}>
                                            <XCircle className="w-4 h-4 me-2" />
                                            {t('cancel')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
