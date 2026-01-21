import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';



export default function ChatHub() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const scrollRef = useRef(null);

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Initial Load: Fetch Chats
    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    // Handle Query Params (Start new chat or Open existing)
    useEffect(() => {
        const sellerId = searchParams.get('sellerId');
        const productId = searchParams.get('productId');
        const productTitle = searchParams.get('productTitle');

        if (user && sellerId && chats.length >= 0) {
            handleStartChat(sellerId, productId, productTitle);
        }
    }, [searchParams, user, chats]);

    // Fetch Messages when chat selected
    useEffect(() => {
        if (selectedChat) {
            // Subscribe to real-time changes
            // Subscribe to real-time changes
            /** @type {any} */
            const channel = supabase.channel(`room:${selectedChat.id}`);

            channel
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages', 
                    filter: `conversation_id=eq.${selectedChat.id}` 
                }, (payload) => {
                    setMessages(prev => [...prev, mapMessage(payload.new)]);
                })
                .subscribe();

            fetchMessages(selectedChat.id);

            return () => {
                channel.unsubscribe();
            };
        }
    }, [selectedChat]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    const fetchChats = async () => {
        setLoadingChats(true);
        try {
            // We need to fetch conversations where we are p1 or p2
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    p1:participant1_id(raw_user_meta_data),
                    p2:participant2_id(raw_user_meta_data),
                    listing:product_id(title)
                `)
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            const mappedChats = data.map(c => {
                const isP1 = c.participant1_id === user.id;
                const otherUser = isP1 ? c.p2 : c.p1; // This might fail if user meta is missing/null
                const otherMeta = otherUser?.raw_user_meta_data || {};
                
                return {
                    id: c.id,
                    name: otherMeta.full_name || otherMeta.name || 'User',
                    subtitle: c.listing?.title || 'Direct Message',
                    avatar: otherMeta.avatar_url || otherMeta.picture,
                    lastMessage: c.last_message || 'Start chatting...',
                    time: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    otherUserId: isP1 ? c.participant2_id : c.participant1_id,
                    isOnline: false, // implementation pending
                    unread: 0
                };
            });
            setChats(mappedChats);
        } catch (error) {
            console.error("Error loading chats:", error);
        } finally {
            setLoadingChats(false);
        }
    };

    const handleStartChat = async (sellerId, productId, productTitle) => {
        // Check if we already have this conversation in our list
        const existingChat = chats.find(c => c.otherUserId === sellerId && c.subtitle === productTitle);
        
        if (existingChat) {
            setSelectedChat(existingChat);
            setShowMobileChat(true);
            // Clear params to avoid loop? Or just leave it.
            return;
        }

        // Create new if not found locally
        // (Double check DB to avoid race conditions/duplicates not yet fetched)
        try {
            // Check DB
            const { data: found } = await supabase.from('conversations')
                .select('*')
                .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${sellerId}),and(participant1_id.eq.${sellerId},participant2_id.eq.${user.id})`)
                .eq('product_id', productId)
                .maybeSingle();

             if (found) {
                 await fetchChats(); // Refresh list to get it
                 // Then select it (find it in new list) - simpler just to reload page or logic
                 // For now, let's just create it if null
             }

             if (!found) {
                const { data: newConv, error } = await supabase.from('conversations').insert({
                    participant1_id: user.id,
                    participant2_id: sellerId,
                    product_id: productId,
                    last_message: `Interested in ${productTitle}` // Initial Context
                }).select().single();

                if (error) throw error;
                await fetchChats(); // Reload to see it
                // We could optimistically add it, but a refresh is safer
             }
        } catch (err) {
            console.error(err);
        }
    };


    const fetchMessages = async (chatId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', chatId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data.map(mapMessage));
        }
    };

    const mapMessage = (m) => ({
        id: m.id,
        sender: m.sender_id === user?.id ? 'me' : 'other',
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: m.type
    });


    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        setShowMobileChat(true);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        const text = messageInput.trim();
        setMessageInput(''); // Optimistic clear

        // Optimistic UI update
        // setMessages(prev => [...prev, { id: 'temp', sender: 'me', text, time: 'Now' }]);

        const { error } = await supabase.from('messages').insert({
            conversation_id: selectedChat.id,
            sender_id: user.id,
            content: text,
            type: 'text'
        });

        if (error) {
            toast({ title: "Failed to send", variant: "destructive" });
        } else {
             // Update conversation last_message
             await supabase.from('conversations')
                .update({ last_message: text, updated_at: new Date() })
                .eq('id', selectedChat.id);
        }
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
                        {loadingChats ? (
                            <div className="p-4 text-center text-slate-500">Loading chats...</div>
                        ) : chats.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">No messages yet</div>
                        ) : (
                            chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => handleChatSelect(chat)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-white hover:shadow-sm border border-transparent'}`}
                                >
                                    <div className="relative">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={chat.avatar} />
                                            <AvatarFallback>{chat.name ? chat.name[0] : 'U'}</AvatarFallback>
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
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className={`flex-1 flex-col bg-white relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
                {/* Chat Header */}
                {!selectedChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Smile className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                ) : (
                    <>
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
                                    <AvatarFallback>{selectedChat.name ? selectedChat.name[0] : '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-bold text-slate-900 leading-tight text-start">{selectedChat.name}</h2>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        {selectedChat.subtitle}
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
                                                    onClick={() => toast({ title: "Booking Request", description: "This feature is coming soon!" })}
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
                         <div ref={scrollRef} />
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
                </>
                )}

                {/* Profile Dialog */}
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>User Profile</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={selectedChat?.avatar} />
                                <AvatarFallback>{selectedChat?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">{selectedChat?.name}</h3>
                                <p className="text-sm text-slate-500">{selectedChat?.subtitle}</p>
                            </div>

                            <div className="w-full space-y-2 mt-4">
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-slate-500">Role</span>
                                    <span className="font-medium">{selectedChat?.subtitle}</span>
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
