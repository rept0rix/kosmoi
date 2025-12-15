import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MapPin, Star, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard'; // Assuming this exists or I'll use a fallback div style
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Initialize Supabase Client (assuming access to env, if not we rely on global or props? No, usually localized)
// Ideally we valid useAuth or similar context, but for a page we can use direct client for public data
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = [
    "All", "Plumber", "Electrician", "Cleaner", "AC Repair", "Gardener", "Driver"
];

const Marketplace = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setLoading(true);
        try {
            let query = supabase.from('service_providers').select('*').eq('status', 'active');
            const { data, error } = await query;
            if (error) throw error;
            setProviders(data || []);
        } catch (error) {
            console.error("Error fetching providers:", error);
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

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full opacity-20 filter blur-3xl"></div>
                <div className="relative z-10 max-w-7xl mx-auto">
                    <h1 className="text-4xl font-extrabold mb-4">Find Local Pros</h1>
                    <p className="text-xl text-slate-300 max-w-2xl">
                        Connect with trusted service providers in Koh Samui. Book instantly.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="What do you need help with?"
                                className="pl-10 bg-transparent border-none text-white placeholder:text-slate-400 focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-8">
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
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

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredProviders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {filteredProviders.map(provider => (
                            <Link key={provider.id} to={`/provider/${provider.id}`} className="group">
                                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                                    <div className="h-40 bg-slate-100 relative overflow-hidden">
                                        {provider.images && provider.images[0] ? (
                                            <img src={provider.images[0]} alt={provider.business_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                <MapPin className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-900 flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            {provider.average_rating || 'New'}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-grow flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="text-xs uppercase tracking-wider text-slate-500 border-slate-200">
                                                {provider.category || 'Service'}
                                            </Badge>
                                            {provider.verified && (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px]">Verified</Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {provider.business_name}
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">
                                            {provider.description || 'No description provided.'}
                                        </p>

                                        <div className="space-y-2 pt-4 border-t border-slate-50">
                                            <div className="flex items-center text-slate-500 text-xs">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {provider.location || 'Samui'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No providers found</h3>
                        <p className="text-slate-500">Try adjusting your search or category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
