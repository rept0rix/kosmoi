import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Phone, Video, MoreVertical, Image as ImageIcon, MapPin, Smile, Paperclip, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// MOCK CONVERSATIONS
const MOCK_CHATS = [
    {
        id: 'c1',
        name: 'Kosmoi Concierge',
        subtitle: 'AI Assistant',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
        lastMessage: 'Here are the top 3 island tours for tomorrow.',
        time: 'Now',
        unread: 1,
        isAi: true
    },
    {
        id: 'c4',
        name: 'העוזר האישי',
        subtitle: 'נציג וירטואלי',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
        lastMessage: 'מצאתי עבורך 3 וילות שמתאימות לתקציב.',
        time: 'עכשיו',
        unread: 1,
        isAi: true
    },
    {
        id: 'c2',
        name: 'Sarah Jenkins',
        subtitle: 'Premium Agent',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        lastMessage: 'The villa owner accepted your offer! 🎉',
        time: '12:30 PM',
        unread: 0,
        isOnline: true
    },
    {
        id: 'c3',
        name: 'Mike Motorbikes',
        subtitle: 'Vendor',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
        lastMessage: 'When would you like to pick up the Honda Click?',
        time: 'Yesterday',
        unread: 0
    }
];

const MOCK_MESSAGES = {
    'c1': [
        { id: 1, sender: 'ai', text: 'Sawasdee! How can I help you plan your day in Koh Samui?', time: '10:00 AM' },
        { id: 2, sender: 'me', text: 'I want to go snorkeling somewhere quiet.', time: '10:01 AM' },
        { id: 3, sender: 'ai', text: 'I found a perfect private customized trip for you. Take a look:', time: '10:01 AM' },
        {
            id: 4,
            sender: 'ai',
            type: 'rich-card',
            content: {
                title: 'Pig Island & Snorkeling Private Tour',
                price: '3,500 THB',
                image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=600',
                rating: 4.8,
                action: 'Book Now'
            },
            time: '10:01 AM'
        }
    ],
    'c4': [
        { id: 1, sender: 'ai', text: 'שלום! אני העוזר האישי שלך ב-Kosmoi. איך אני יכול לעזור לך היום?', time: '10:00' },
        { id: 2, sender: 'me', text: 'אני מחפש וילה למשפחה בצ׳אוונג נוי.', time: '10:01' },
        { id: 3, sender: 'ai', text: 'מעולה. מצאתי כמה אפשרויות מצוינות באזור הזה:', time: '10:01' },
        {
            id: 4,
            sender: 'ai',
            type: 'rich-card',
            content: {
                title: 'וילה יוקרתית עם בריכת אינסוף',
                price: '25,000,000 ₪',
                image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
                rating: 5.0,
                action: 'צפה בפרטים'
            },
            time: '10:02'
        }
    ],
    'c2': [
        { id: 1, sender: 'me', text: 'Hi Sarah, is the villa still available?', time: 'Mon' },
        { id: 2, sender: 'sarah', text: 'Yes it is! Would you like to schedule a viewing?', time: 'Mon' },
        { id: 3, sender: 'sarah', text: 'The villa owner accepted your offer! 🎉', time: '12:30 PM' }
    ]
};

export default function ChatHub() {
    const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
    const [messageInput, setMessageInput] = useState('');

    const [messages, setMessages] = useState(MOCK_MESSAGES['c1']);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    // The "Array behind it" - storing bookings
    // The "Array behind it" - storing bookings
    const [bookings, setBookings] = useState([]);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const { toast } = useToast();

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        setMessages(MOCK_MESSAGES[chat.id] || []);
        setShowMobileChat(true);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'me',
            text: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setMessageInput('');
    };

    const handleBooking = (item) => {
        // Add to backend array (simulated)
        setBookings([...bookings, { ...item, status: 'pending', timestamp: new Date() }]);

        toast({
            title: "Booking Request Sent",
            description: `We've received your request for ${item.title}. An agent will confirm shortly.`,
            variant: "default",
        });
    };

    return (
        // Adjusted height to account for Header (~64px) and Bottom Nav/Padding (~80-90px)
        // This prevents the whole page from scrolling and ensures the input stays visible above the bottom nav
        <div className="flex bg-white h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-slate-200 shadow-sm mx-4 mt-2">
            {/* Sidebar List */}
            <div className={`w-full md:w-[350px] border-e border-slate-200 flex-col bg-slate-50/50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h1 className="text-xl font-bold mb-4">Messages</h1>
                    <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input placeholder="Search chats..." className="ps-9 bg-slate-100 border-0" />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {MOCK_CHATS.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatSelect(chat)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-white hover:shadow-sm border border-transparent'}`}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={chat.avatar} />
                                        <AvatarFallback>{chat.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {chat.isOnline && <span className="absolute bottom-0 end-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                </div>
                                <div className="flex-1 min-w-0 text-start">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <span className={`font-semibold truncate ${selectedChat?.id === chat.id ? 'text-indigo-900' : 'text-slate-900'}`}>{chat.name}</span>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ms-2">{chat.time}</span>
                                    </div>
                                    <p className={`text-sm truncate ${chat.unread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>{chat.lastMessage}</p>
                                </div>
                                {chat.unread > 0 && (
                                    <Badge className="bg-indigo-600 h-5 w-5 flex items-center justify-center p-0 rounded-full">{chat.unread}</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex-col bg-white relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
                {/* Chat Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur sticky top-0 z-10">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        {/* Back Button for Mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-slate-500 mr-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMobileChat(false);
                            }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={selectedChat.avatar} />
                            <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold text-slate-900 leading-tight text-start">{selectedChat.name}</h2>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                {selectedChat.isAi ? <span className="text-indigo-500 font-medium">AI Concierge</span> : selectedChat.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600" onClick={() => alert("Voice calling coming soon!")}>
                            <Phone className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600" onClick={() => alert("Video calling coming soon!")}>
                            <Video className="w-5 h-5" />
                        </Button>
                        <Separator orientation="vertical" className="h-6 mx-1" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setIsProfileOpen(true)}>
                                    View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                                <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Block User</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Messages Feed */}
                <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[80%] ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>

                                    {/* Text Message Bubble */}
                                    {msg.text && (
                                        <div
                                            dir="auto"
                                            className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}
                                        >
                                            {msg.text}
                                        </div>
                                    )}

                                    {/* Rich Card (Experiences / Products) */}
                                    {msg.type === 'rich-card' && (
                                        <Card className="mt-2 w-[280px] overflow-hidden border-slate-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                                            <div className="h-32 bg-slate-200 relative">
                                                <img src={msg.content.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={msg.content.title} />
                                                <Badge className="absolute top-2 right-2 bg-white/90 text-slate-900 backdrop-blur shadow-sm">
                                                    ★ {msg.content.rating}
                                                </Badge>
                                            </div>
                                            <CardContent className="p-3 text-start">
                                                <h3 className="font-bold text-slate-900 text-sm mb-1">{msg.content.title}</h3>
                                                <p className="text-indigo-600 font-bold text-lg mb-3">{msg.content.price}</p>
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-slate-900 hover:bg-black text-white rounded-lg"
                                                    onClick={() => handleBooking(msg.content)}
                                                >
                                                    {msg.content.action}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {msg.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 h-10 w-10">
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <textarea
                            dir="auto"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-2.5 max-h-32 min-h-[44px] text-sm"
                            rows={1}
                        />
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 h-10 w-10">
                            <Smile className="w-5 h-5" />
                        </Button>
                        <Button onClick={handleSendMessage} className="h-10 w-10 rounded-lg p-0 bg-indigo-600 hover:bg-indigo-700 shadow-md">
                            <Send className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                </div>

                {/* Profile Dialog */}
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>User Profile</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={selectedChat.avatar} />
                                <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">{selectedChat.name}</h3>
                                <p className="text-sm text-slate-500">{selectedChat.subtitle}</p>
                                {selectedChat.isOnline && (
                                    <Badge variant="outline" className="mt-2 border-green-200 text-green-700 bg-green-50">Online Now</Badge>
                                )}
                            </div>

                            <div className="w-full space-y-2 mt-4">
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-slate-500">Role</span>
                                    <span className="font-medium">{selectedChat.subtitle}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-slate-500">Location</span>
                                    <span className="font-medium">Koh Samui, Thailand</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-slate-500">Member Since</span>
                                    <span className="font-medium">December 2024</span>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full mt-2">
                                <Button className="flex-1" variant="outline" onClick={() => setIsProfileOpen(false)}>Close</Button>
                                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">Message</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
