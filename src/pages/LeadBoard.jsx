import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { db } from '@/api/supabaseClient';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Lock, Unlock, Phone, User, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function LeadBoard() {
    const { toast } = useToast();
    const [unlockedLeads, setUnlockedLeads] = useState({});

    const { data: leads, isLoading } = useQuery({
        queryKey: ["leads"],
        queryFn: async () => {
            const { data, error } = await db.from('service_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const handleUnlock = (leadId) => {
        // In a real app, this would trigger a payment/credit deduction transaction
        toast({
            title: "ליד נפתח בהצלחה!",
            description: "פרטי הקשר גלויים כעת. 5 קרדיטים ירדו מחשבונך.",
            className: "bg-green-50 border-green-200",
        });

        setUnlockedLeads(prev => ({
            ...prev,
            [leadId]: true
        }));
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">לוח לידים</h1>
                    <p className="text-gray-600">בקשות שירות חדשות באזור קוסמוי. פתח לידים כדי ליצור קשר עם לקוחות.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {leads?.map((lead) => (
                        <Card key={lead.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-t-4 border-t-blue-600">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="text-sm px-3 py-1">
                                        {lead.category}
                                    </Badge>
                                    <Badge className={`${getUrgencyColor(lead.urgency)} border`}>
                                        {lead.urgency}
                                    </Badge>
                                </div>
                                <h3 className="text-lg font-bold line-clamp-2">{lead.description}</h3>
                            </CardHeader>

                            <CardContent className="pb-3 text-sm space-y-3">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{lead.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(lead.created_at).toLocaleDateString('he-IL')}</span>
                                </div>

                                {/* Masked/Unmasked Contact Info */}
                                <div className={`mt-4 p-4 rounded-lg ${unlockedLeads[lead.id] ? 'bg-green-50 border border-green-100' : 'bg-gray-100 border border-gray-200'}`}>
                                    {unlockedLeads[lead.id] ? (
                                        <div className="space-y-2 animate-in fade-in duration-500">
                                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                                <User className="w-4 h-4 text-green-600" />
                                                {lead.contact_name}
                                            </div>
                                            <div className="flex items-center gap-2 font-bold text-lg text-green-700">
                                                <Phone className="w-4 h-4" />
                                                <a href={`tel:${lead.contact_phone}`} className="hover:underline">
                                                    {lead.contact_phone}
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 filter blur-[1px] select-none opacity-60">
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="w-4 h-4" />
                                                {lead.contact_name.charAt(0)}... (חסוי)
                                            </div>
                                            <div className="flex items-center gap-2 font-bold">
                                                <Phone className="w-4 h-4" />
                                                050-*******
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="bg-gray-50 p-4 border-t">
                                {unlockedLeads[lead.id] ? (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 gap-2" disabled>
                                        <Unlock className="w-4 h-4" />
                                        הליד פתוח
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleUnlock(lead.id)}
                                        className="w-full gap-2 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Lock className="w-4 h-4" />
                                        פתח ליד (5 קרדיטים)
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
