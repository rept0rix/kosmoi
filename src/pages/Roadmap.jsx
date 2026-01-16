
import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Using Card from UI lib
import { ArrowUp, Calendar, CheckCircle, Clock, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusColumn = ({ title, icon: Icon, color, items, onVote }) => (
    <div className="flex-1 min-w-[300px] flex flex-col gap-4">
        <div className={`flex items-center gap-2 pb-2 border-b-2`} style={{ borderColor: color }}>
            <Icon className="w-5 h-5" style={{ color }} />
            <h3 className="font-bold text-lg text-slate-100">{title}</h3>
            <Badge variant="outline" className="ml-auto text-slate-400 border-slate-700">
                {items.length}
            </Badge>
        </div>
        <div className="space-y-4">
            {items.map(item => (
                <RoadmapCard key={item.id} item={item} color={color} onVote={onVote} />
            ))}
        </div>
    </div>
);

const RoadmapCard = ({ item, color, onVote }) => {
    const [voting, setVoting] = useState(false);

    const handleVote = async () => {
        setVoting(true);
        await onVote(item.id);
        setVoting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
        >
            <Card className="bg-slate-900/50 border-white/10 hover:border-white/20 transition-all backdrop-blur-md overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                        <CardTitle className="text-base text-slate-200 leading-snug">
                            {item.title}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleVote}
                            disabled={voting}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 flex flex-col items-center h-auto py-2 min-w-[50px]"
                        >
                            <ArrowUp className={`w-4 h-4 mb-1 ${voting ? 'animate-bounce text-yellow-400' : ''}`} />
                            <span className="text-xs font-mono font-bold">{item.votes}</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                        {item.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-none">
                            {item.category}
                        </Badge>
                        {item.eta && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.eta}
                            </span>
                        )}
                    </div>
                </CardContent>
                <div className="absolute top-0 left-0 w-1 h-full opacity-50" style={{ backgroundColor: color }} />
            </Card>
        </motion.div>
    );
};

const Roadmap = () => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFeatures = async () => {
        const { data, error } = await supabase
            .from('roadmap_features')
            .select('*')
            .order('votes', { ascending: false });

        if (data) setFeatures(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchFeatures();

        // Subscription for live updates
        const channel = supabase
            .channel('public:roadmap_features')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap_features' }, fetchFeatures)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleVote = async (id) => {
        // Optimistic UI update
        setFeatures(prev => prev.map(f =>
            f.id === id ? { ...f, votes: f.votes + 1 } : f
        ));

        const { error } = await supabase.rpc('increment_vote', { row_id: id });
        if (error) console.error("Vote failed:", error);
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Roadmap...</div>;

    const planned = features.filter(f => f.status === 'planned');
    const inProgress = features.filter(f => f.status === 'in_progress');
    const live = features.filter(f => f.status === 'live');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                        Public Roadmap
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Help us build the future of Kosmoi. Vote on the features you want to see next.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto pb-8">
                    <StatusColumn
                        title="Planned"
                        icon={Calendar}
                        color="#94a3b8"
                        items={planned}
                        onVote={handleVote}
                    />
                    <StatusColumn
                        title="In Progress"
                        icon={Clock}
                        color="#60a5fa"
                        items={inProgress}
                        onVote={handleVote}
                    />
                    <StatusColumn
                        title="Live"
                        icon={PartyPopper}
                        color="#4ade80"
                        items={live}
                        onVote={handleVote}
                    />
                </div>
            </div>
        </div>
    );
};

export default Roadmap;
