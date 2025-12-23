import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Heart, Tag, Info, Check } from 'lucide-react';

const NOTIFICATIONS = [
    {
        id: 1,
        type: 'message',
        title: 'New Message from Sarah',
        description: 'Hey, is the villa still available for viewing tomorrow?',
        time: '5 min ago',
        unread: true,
        icon: MessageCircle,
        color: 'text-indigo-600 bg-indigo-100'
    },
    {
        id: 2,
        type: 'alert',
        title: 'Price Drop Alert',
        description: 'The "Honda Click 160cc" you liked dropped price by ฿2,000!',
        time: '2 hours ago',
        unread: true,
        icon: Tag,
        color: 'text-green-600 bg-green-100'
    },
    {
        id: 3,
        type: 'system',
        title: 'Welcome to Kosmoi',
        description: 'Thanks for joining! Complete your profile to get verified.',
        time: '1 day ago',
        unread: false,
        icon: Info,
        color: 'text-blue-600 bg-blue-100'
    },
    {
        id: 4,
        type: 'like',
        title: 'New Like',
        description: 'John D. liked your listing "L-Shape Sofa"',
        time: '2 days ago',
        unread: false,
        icon: Heart,
        color: 'text-pink-600 bg-pink-100'
    }
];

export default function Notifications() {
    return (
        <div className="min-h-screen bg-slate-50 flex justify-center py-8 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                        Mark all as read
                    </Button>
                </div>

                <ScrollArea className="h-[80vh]">
                    <div className="divide-y divide-slate-50">
                        {NOTIFICATIONS.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${notif.unread ? 'bg-indigo-50/30' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                                    <notif.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`text-sm font-semibold ${notif.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{notif.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed pr-6">
                                        {notif.description}
                                    </p>
                                </div>
                                {notif.unread && (
                                    <div className="self-center">
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 text-center text-slate-400 text-sm">
                        <p>No more notifications</p>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
