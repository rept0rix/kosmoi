import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listFilesFromSupabase, saveFileToSupabase, createTicketInSupabase } from '../services/agents/memorySupabase';
import { useAuth } from '../lib/AuthContext';

export default function PersistenceTest() {
    const { user, navigateToLogin } = useAuth();
    const [files, setFiles] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch Files
            const fileList = await listFilesFromSupabase(user.id);
            setFiles(fileList);

            // Fetch Tickets (we need to import or fetch manually since we didn't export listTickets)
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const accessToken = localStorage.getItem('sb-access-token');

            const res = await fetch(`${supabaseUrl}/rest/v1/agent_tickets?user_id=eq.${user.id}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (res.ok) {
                const ticketList = await res.json();
                setTickets(ticketList);
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSimulateFile = async () => {
        if (!user) return;
        setLoading(true);
        await saveFileToSupabase(`simulation_${Date.now()}.txt`, "This is a simulated file.", "test-agent", user.id);
        await fetchData();
    };

    const handleSimulateTicket = async () => {
        if (!user) return;
        setLoading(true);
        await createTicketInSupabase({
            ticket_id: `sim_ticket_${Date.now()}`,
            title: "Simulated Ticket",
            description: "Testing persistence from button click",
            priority: "low",
            status: "open",
            agent_id: "test-agent"
        }, user.id);
        await fetchData();
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (!user) {
        return (
            <div className="p-8 flex flex-col items-center gap-4">
                <p>Please log in to test persistence.</p>
                <Button onClick={navigateToLogin}>Go to Login</Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Agent Persistence Test</h1>
                <div className="flex gap-2">
                    <Button onClick={handleSimulateFile} variant="outline" disabled={loading}>
                        + Test File
                    </Button>
                    <Button onClick={handleSimulateTicket} variant="outline" disabled={loading}>
                        + Test Ticket
                    </Button>
                    <Button onClick={fetchData} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Files Section */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        📂 Agent Files
                        <span className="text-sm font-normal text-gray-500">({files.length})</span>
                    </h2>
                    <div className="bg-slate-50 rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                        {files.length === 0 ? (
                            <p className="text-gray-400 text-center italic mt-10">No files found in Supabase.</p>
                        ) : (
                            <ul className="space-y-2">
                                {files.map((file, idx) => (
                                    <li key={idx} className="p-2 bg-white border rounded shadow-sm flex justify-between items-center">
                                        <span className="font-mono text-sm">{file.path}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(file.updated_at).toLocaleTimeString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>

                {/* Tickets Section */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        🎫 Agent Tickets
                        <span className="text-sm font-normal text-gray-500">({tickets.length})</span>
                    </h2>
                    <div className="bg-slate-50 rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                        {tickets.length === 0 ? (
                            <p className="text-gray-400 text-center italic mt-10">No tickets found in Supabase.</p>
                        ) : (
                            <ul className="space-y-2">
                                {tickets.map((ticket, idx) => (
                                    <li key={idx} className="p-2 bg-white border rounded shadow-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-sm">{ticket.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{ticket.description}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">How to Verify:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                    <li>Go to the <strong>Agent Chat</strong>.</li>
                    <li>Ask an agent to "create a file called <code>cloud_test.txt</code>".</li>
                    <li>Ask an agent to "create a ticket for fixing the login page".</li>
                    <li>Come back here and click <strong>Refresh Data</strong>.</li>
                    <li>If the items appear above, the database connection is working!</li>
                </ol>
            </div>
        </div>
    );
}
