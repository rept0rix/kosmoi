import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { db } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Clock, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MyRequests() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const language = i18n.language;

    const { data: user } = useQuery({
        queryKey: ["currentUser"],
        queryFn: () => db.auth.me(),
    });

    const { data: requests, isLoading } = useQuery({
        queryKey: ["myRequests", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await db.from('service_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const getStatusBadge = (status) => {
        const statusLabel = t(`status.${status}`) || status;
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{statusLabel}</Badge>;
            case 'in_progress':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{statusLabel}</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">{statusLabel}</Badge>;
            case 'cancelled':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{statusLabel}</Badge>;
            default:
                return <Badge variant="outline">{statusLabel}</Badge>;
        }
    };

    const getUrgencyLabel = (urgency) => {
        return t(`urgency.${urgency}`) || urgency;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{t('my_requests.title')}</h1>
                    <Button onClick={() => navigate('/RequestService')} className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t('my_requests.new_request')}
                    </Button>
                </div>

                {!requests || requests.length === 0 ? (
                    <Card className="text-center p-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium">{t('my_requests.no_active')}</h3>
                            <p className="text-gray-500">{t('my_requests.no_active_desc')}</p>
                            <Button onClick={() => navigate('/RequestService')} variant="outline">
                                {t('my_requests.create_first')}
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="bg-white border-b p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-bold mb-1">
                                                {t(request.category) || request.category}
                                            </CardTitle>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                                                <span className="mx-1">•</span>
                                                <Clock className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                            <span className="text-gray-700">{request.location}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                                            {request.description}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                {t('my_requests.urgency')}: {getUrgencyLabel(request.urgency)}
                                            </Badge>
                                            {request.images && request.images.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {request.images.length} {t('my_requests.images')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
