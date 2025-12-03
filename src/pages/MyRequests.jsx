import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { db } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Clock, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyRequests() {
    const navigate = useNavigate();

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
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ממתין</Badge>;
            case 'in_progress':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">בטיפול</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">הושלם</Badge>;
            case 'cancelled':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-800">בוטל</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getUrgencyLabel = (urgency) => {
        const labels = {
            low: "לא דחוף",
            medium: "רגיל",
            high: "דחוף",
            emergency: "חירום"
        };
        return labels[urgency] || urgency;
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
                    <h1 className="text-2xl font-bold text-gray-900">הבקשות שלי</h1>
                    <Button onClick={() => navigate('/RequestService')} className="gap-2">
                        <Plus className="w-4 h-4" />
                        בקשה חדשה
                    </Button>
                </div>

                {!requests || requests.length === 0 ? (
                    <Card className="text-center p-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium">אין בקשות פעילות</h3>
                            <p className="text-gray-500">עדיין לא ביקשת שירות. צריכים עזרה במשהו?</p>
                            <Button onClick={() => navigate('/RequestService')} variant="outline">
                                צור בקשה ראשונה
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
                                                {request.category === 'ac_repair' ? 'תיקון מזגן' : request.category}
                                            </CardTitle>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleDateString('he-IL')}
                                                <span className="mx-1">•</span>
                                                <Clock className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
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
                                                דחיפות: {getUrgencyLabel(request.urgency)}
                                            </Badge>
                                            {request.images && request.images.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {request.images.length} תמונות
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
