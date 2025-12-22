import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard'; // Assuming this exists or I'll use a fallback div style
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '../api/supabaseClient';

const CATEGORIES = [
    "All", "Plumber", "Electrician", "Cleaner", "AC Repair", "Gardener", "Driver"
];

const Marketplace = () => {
    const [providers, setProviders] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('agents'); // 'agents' or 'providers'
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Service Providers
            const { data: providersData } = await supabase.from('service_providers').select('*').in('status', ['active', 'new_lead']);
            setProviders(providersData || []);

            // Fetch Published AI Agents
            const { data: agentsData } = await supabase.from('workflows')
                .select('*')
                .eq('deployment_status', 'published')
                .order('version', { ascending: false });

            // Deduplicate: Keep only latest version of each workflow (by ID ideally, but distinct on name/id)
            // For now, simpler list
            setAgents(agentsData || []);

        } catch (error) {
            console.error("Error fetching marketplace data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" ||
            (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
        return matchesSearch && matchesCategory;
    });

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full opacity-20 filter blur-3xl"></div>
                <div className="relative z-10 max-w-7xl mx-auto">
                    <h1 className="text-4xl font-extrabold mb-4">Marketplace</h1>
                    <p className="text-xl text-slate-300 max-w-2xl">
                        Find local pros or chat with intelligent agents.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 bg-transparent border-none text-white placeholder:text-slate-400 focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-full shadow-lg border border-slate-100 inline-flex">
                        <button
                            onClick={() => setActiveTab('agents')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'agents' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Start AI Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('providers')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'providers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Human Pros
                        </button>
                    </div>
                </div>

                {activeTab === 'providers' && (
                    <>
                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Providers Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>)}
                            </div>
                        ) : filteredProviders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProviders.map(provider => (
                                    <Link key={provider.id} to={`/provider/${provider.id}`} className="group">
                                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                                            {/* Provider Card Image */}
                                            <div className="h-40 bg-slate-100 relative items-center justify-center flex overflow-hidden">
                                                {provider.image_url ? (
                                                    <img src={provider.image_url} alt={provider.business_name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <MapPin className="w-12 h-12 text-slate-300" />
                                                )}
                                                {provider.status === 'new_lead' && (
                                                    <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 border-yellow-500/20">New</Badge>
                                                )}
                                            </div>
                                            <div className="p-5 flex-grow flex flex-col">
                                                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                    {provider.business_name}
                                                </h3>
                                                <Button className="w-full mt-4">View Profile</Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-500">No providers found.</div>
                        )}
                    </>
                )}

                {activeTab === 'agents' && (
                    <div className="mt-4">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>)}
                            </div>
                        ) : filteredAgents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAgents.map(agent => (
                                    <Link key={agent.id} to={`/chat/${agent.id}`} className="group">
                                        <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Star className="w-24 h-24 rotate-12" />
                                            </div>

                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                                    <Star className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                                        {agent.name}
                                                    </h3>
                                                    <Badge variant="outline" className="mt-1 border-green-200 text-green-700 bg-green-50 text-[10px]">
                                                        v{agent.version} • Published
                                                    </Badge>
                                                </div>
                                            </div>

                                            <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                                {agent.description || "An intelligent service agent ready to assist you."}
                                            </p>

                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-[1.02] transition-transform">
                                                Start Chat <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No Agents Published Yet</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                    Go to the Studio to build and publish your first Service Agent!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
