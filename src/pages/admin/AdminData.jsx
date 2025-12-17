import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminData = () => {
    const [loading, setLoading] = useState(true);
    const [mrrData, setMrrData] = useState([]);
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [eventDistribution, setEventDistribution] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch all events for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at');

            if (error) throw error;

            processCharts(data);

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const processCharts = (events) => {
        // 1. Process MRR (Purchases)
        const revenueByDay = {};
        // 2. Process User Growth (Signups)
        const signupsByDay = {};
        // 3. Event Distribution
        const eventCounts = {};

        events.forEach(event => {
            const date = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // MRR
            if (event.event_name === 'purchase') {
                const amount = event.properties?.value || 0;
                revenueByDay[date] = (revenueByDay[date] || 0) + amount;
            }

            // Growth
            if (event.event_name === 'signup') {
                signupsByDay[date] = (signupsByDay[date] || 0) + 1;
            }

            // Dist
            eventCounts[event.event_name] = (eventCounts[event.event_name] || 0) + 1;
        });

        // Convert to Arrays for Recharts
        const mrrArray = Object.keys(revenueByDay).map(date => ({
            date,
            revenue: revenueByDay[date]
        }));

        const growthArray = Object.keys(signupsByDay).map(date => ({
            date,
            users: signupsByDay[date]
        }));

        const distArray = Object.keys(eventCounts).map(name => ({
            name,
            value: eventCounts[name]
        }));

        setMrrData(mrrArray);
        setUserGrowthData(growthArray);
        setEventDistribution(distArray);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handleSeedData = async () => {
        setLoading(true);
        try {
            const events = [];
            const today = new Date();

            // Generate 30 days of data
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                // Random stats per day
                const signups = Math.floor(Math.random() * 5) + 1; // 1-5 signups
                const purchases = Math.floor(Math.random() * 3); // 0-2 purchases
                const views = Math.floor(Math.random() * 50) + 20; // 20-70 views

                // Signups
                for (let j = 0; j < signups; j++) {
                    events.push({
                        event_name: 'signup',
                        created_at: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
                        properties: { source: Math.random() > 0.5 ? 'organic' : 'ads' }
                    });
                }

                // Purchases
                for (let k = 0; k < purchases; k++) {
                    const value = Math.floor(Math.random() * 2000) + 500;
                    events.push({
                        event_name: 'purchase',
                        created_at: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
                        properties: { value, plan: 'premium' }
                    });
                }

                // Page Views (just a few for distribution chart)
                for (let l = 0; l < views; l++) {
                    events.push({
                        event_name: 'page_view',
                        created_at: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
                        properties: { path: '/home' }
                    });
                }
            }

            // Batch insert
            const { error } = await supabase.from('analytics_events').insert(events);
            if (error) throw error;

            fetchAnalytics(); // Refresh

        } catch (error) {
            console.error("Error seeding data:", error);
            alert("Failed to seed data. Ensure 'analytics_events' table exists.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading Analytics Agent...</div>;

    return (
        <div className="p-8 bg-slate-900 text-white min-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Platform Analytics
                </h1>
                <button
                    onClick={handleSeedData}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-sm text-slate-300 transition-colors"
                >
                    Generate Demo Data
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* MRR Chart */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-slate-200">Revenue Trend (30 Days)</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        {mrrData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mrrData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-500 text-sm">No revenue data available yet.</div>
                        )}
                    </div>
                </div>

                {/* User Growth */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-slate-200">New Signups</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        {userGrowthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                    />
                                    <Bar dataKey="users" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-500 text-sm">No signup data available yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold mb-4 text-slate-200">Event Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={eventDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {eventDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminData;
