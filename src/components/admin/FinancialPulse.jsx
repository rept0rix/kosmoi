
import React, { useEffect, useState } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { Card } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

const FinancialPulse = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, growth: 0 });

    useEffect(() => {
        const fetchData = async () => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: transactions, error } = await realSupabase
                .from('transactions')
                .select('*')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching financial data:', error);
                setLoading(false);
                return;
            }

            // Group by Day
            const grouped = {};
            // Initialize last 7 days
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue
                grouped[dayName] = { name: dayName, revenue: 0, vibes: 0, date: d };
            }

            let totalRev = 0;

            transactions.forEach(tx => {
                const dayName = new Date(tx.created_at).toLocaleDateString('en-US', { weekday: 'short' });
                if (grouped[dayName]) {
                    if (tx.currency === 'VIBES') {
                        grouped[dayName].vibes += Number(tx.amount);
                    } else {
                        // Assume THB/USD is revenue for 'deposit' or 'payment' types
                        if (['deposit', 'topup', 'payment'].includes(tx.type)) {
                            grouped[dayName].revenue += Number(tx.amount);
                            totalRev += Number(tx.amount);
                        }
                    }
                }
            });

            // Convert to array and reverse to show Mon -> Sun order if needed, 
            // but we initialized reverse-chronologically in the loop? 
            // Actually the loop `d.setDate(d.getDate() - i)` goes detailed today -> 7 days ago.
            // Charts usually want Oldest -> Newest (Left to Right).
            const chartData = Object.values(grouped).sort((a, b) => a.date - b.date);

            setData(chartData);
            setStats({ totalRevenue: totalRev, growth: 0 }); // Todo: calculate real growth
            setLoading(false);
        };

        fetchData();

        // Optional: Subscribe to changes for live updates
        const channel = realSupabase
            .channel('financial-pulse')
            // @ts-ignore
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transactions' },
                () => fetchData()
            )
            .subscribe();

        return () => {
            if (channel) channel.unsubscribe();
        };

    }, []);

    return (
        <Card className="p-6 bg-slate-900/40 border-white/5 h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Financial Pulse
                    </h3>
                    <p className="text-xs text-slate-400">7-Day Transaction Volume</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
                        <div className="text-xs text-green-400">7 Day Volume</div>
                    </div>
                </div>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorVibes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                        <Area type="monotone" dataKey="vibes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVibes)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-slate-300">Stripe Income</span>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-slate-300">Vibes Awarded</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default FinancialPulse;
