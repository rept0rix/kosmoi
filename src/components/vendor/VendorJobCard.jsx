import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, MapPin, Clock } from 'lucide-react';

export default function VendorJobCard({ job, onAccept, onReject }) {
    const { id, serviceName, customerName, time, price, location, status } = job;

    if (status !== 'pending') return null;

    return (
        <Card className="mb-4 shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{serviceName}</h3>
                        <p className="text-sm text-gray-500">{customerName}</p>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-green-600 text-lg">${price}</span>
                        <span className="text-xs text-gray-400">Est. Earnings</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[100px]">{location}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                        onClick={() => onReject(id)}
                    >
                        <X className="w-4 h-4 mr-2" /> Decline
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onAccept(id)}
                    >
                        <Check className="w-4 h-4 mr-2" /> Accept
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
