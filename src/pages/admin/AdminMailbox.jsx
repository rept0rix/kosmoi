import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, RefreshCw, Archive, CheckCircle } from 'lucide-react';

const AdminMailbox = () => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState(null);

    useEffect(() => {
        fetchEmails();

        // Realtime Subscription
        const channel = supabase
            .channel('public:inbound_emails')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbound_emails' }, (payload) => {
                setEmails(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inbound_emails')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setEmails(data);
        setLoading(false);
    };

    const markAsRead = async (emailId) => {
        await supabase.from('inbound_emails').update({ processed_status: 'read' }).eq('id', emailId);
        setEmails(prev => prev.map(e => e.id === emailId ? { ...e, processed_status: 'read' } : e));
    };

    return (
        <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Mail className="w-8 h-8 text-indigo-500" />
                    <h1 className="text-3xl font-bold tracking-tight text-white">Admin Mailbox</h1>
                </div>
                <button onClick={fetchEmails} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <div className="grid grid-cols-12 gap-6 h-full">
                {/* Email List */}
                <Card className="col-span-4 bg-slate-900 border-slate-800 flex flex-col h-full overflow-hidden">
                    <CardHeader className="py-3 bg-slate-950/50 border-b border-slate-800">
                        <CardTitle className="text-sm font-medium text-slate-400">Inbox ({emails.length})</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {emails.map(email => (
                                <div
                                    key={email.id}
                                    onClick={() => { setSelectedEmail(email); if (email.processed_status === 'unread') markAsRead(email.id); }}
                                    className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition ${selectedEmail?.id === email.id ? 'bg-indigo-900/20 border-l-4 border-l-indigo-500' : ''} ${email.processed_status === 'unread' ? 'bg-slate-800/10' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm font-semibold ${email.processed_status === 'unread' ? 'text-white' : 'text-slate-400'}`}>
                                            {email.sender}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`text-sm mb-1 truncate ${email.processed_status === 'unread' ? 'text-slate-200' : 'text-slate-500'}`}>
                                        {email.subject || '(No Subject)'}
                                    </div>
                                    <div className="text-xs text-slate-600 truncate">
                                        {email.body_text?.substring(0, 50)}...
                                    </div>
                                </div>
                            ))}
                            {emails.length === 0 && !loading && (
                                <div className="p-8 text-center text-slate-500 text-sm">No emails yet.</div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Email Detail */}
                <Card className="col-span-8 bg-slate-900 border-slate-800 flex flex-col h-full">
                    {selectedEmail ? (
                        <>
                            <CardHeader className="py-4 bg-slate-950/50 border-b border-slate-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{selectedEmail.subject}</h2>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span>From: <strong className="text-indigo-400">{selectedEmail.sender}</strong></span>
                                            <span>•</span>
                                            <span>{new Date(selectedEmail.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="border-green-500/20 text-green-400 bg-green-500/10">
                                            {selectedEmail.processed_status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 overflow-y-auto flex-1 font-mono text-sm text-slate-300 whitespace-pre-wrap">
                                {selectedEmail.body_text}
                                {selectedEmail.body_html && (
                                    <div className="mt-8 pt-4 border-t border-slate-800">
                                        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">HTML Content Preview</h3>
                                        <div className="bg-white text-black p-4 rounded-md" dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                                    </div>
                                )}
                            </CardContent>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Mail className="w-16 h-16 opacity-20 mb-4" />
                            <p>Select an email to read</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminMailbox;
