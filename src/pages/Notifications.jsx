import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Bell, MessageCircle, Heart, Tag, Info, Check, ArrowRight, ExternalLink } from 'lucide-react';

const NOTIFICATIONS = [
    {
        id: 1,
        type: 'message',
        title: 'New Message from Sarah',
        description: 'Hey, is the villa still available for viewing tomorrow? I would love to schedule a visit around 2 PM if possible.',
        time: '5 min ago',
        unread: true,
        icon: MessageCircle,
        color: 'text-indigo-600 bg-indigo-100',
        actionLabel: 'Reply',
        actionLink: '/chat/sarah'
    },
    {
        id: 2,
        type: 'alert',
        title: 'Price Drop Alert',
        description: 'Great news! The "Honda Click 160cc" you liked has dropped price by ฿2,000! Valid for the next 24 hours only.',
        time: '2 hours ago',
        unread: true,
        icon: Tag,
        color: 'text-green-600 bg-green-100',
        actionLabel: 'View Deal',
        actionLink: '/marketplace/123'
    },
    {
        id: 3,
        type: 'system',
        title: 'Welcome to Kosmoi',
        description: 'Thanks for joining! Complete your profile to get verified and start booking instantly. It takes less than 2 minutes.',
        time: '1 day ago',
        unread: false,
        icon: Info,
        color: 'text-blue-600 bg-blue-100',
        actionLabel: 'Complete Profile',
        actionLink: '/profile/edit'
    },
    {
        id: 4,
        type: 'like',
        title: 'New Like',
        description: 'John D. liked your listing "L-Shape Sofa"',
        time: '2 days ago',
        unread: false,
        icon: Heart,
        color: 'text-pink-600 bg-pink-100',
        actionLabel: 'View Listing',
        actionLink: '/marketplace/456'
    }
];

export default function Notifications() {
    const { t } = useTranslation();
    const [selectedNotification, setSelectedNotification] = useState(null);

    const handleAction = (link) => {
        // In a real app, use navigate(link)
        console.log("Navigating to:", link);
        setSelectedNotification(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center py-8 px-4 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">{t('notifications.title')}</h1>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                        {t('notifications.mark_all_read')}
                    </Button>
                </div>

                <ScrollArea className="h-[80vh]">
                    <div className="divide-y divide-slate-50">
                        {NOTIFICATIONS.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => setSelectedNotification(notif)}
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
                                        <span className="text-xs text-slate-400 whitespace-nowrap ms-2">{notif.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed pe-6 line-clamp-2" dir="auto">
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
                        <p>{t('notifications.no_more')}</p>
                    </div>
                </ScrollArea>
            </div>

            {/* Notification Details Dialog */}
            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-2xl p-0 overflow-hidden border-0">
                    {selectedNotification && (
                        <>
                            <div className={`h-24 ${selectedNotification.color.split(' ')[1]} flex items-center justify-center`}>
                                <selectedNotification.icon className={`w-10 h-10 ${selectedNotification.color.split(' ')[0]}`} />
                            </div>

                            <div className="p-6">
                                <DialogHeader className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="capitalize">
                                            {selectedNotification.type}
                                        </Badge>
                                        <span className="text-xs text-slate-400">{selectedNotification.time}</span>
                                    </div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {selectedNotification.title}
                                    </DialogTitle>
                                </DialogHeader>

                                <ScrollArea className="max-h-[300px] mb-6">
                                    <DialogDescription className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {selectedNotification.description}
                                    </DialogDescription>
                                </ScrollArea>

                                <DialogFooter className="flex-col sm:flex-col gap-2">
                                    {selectedNotification.actionLabel && (
                                        <Button
                                            className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                            onClick={() => handleAction(selectedNotification.actionLink)}
                                        >
                                            {selectedNotification.actionLabel}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-slate-200"
                                        onClick={() => setSelectedNotification(null)}
                                    >
                                        {t('notifications.close')}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
