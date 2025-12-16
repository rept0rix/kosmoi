
import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MapPin, Bath, Bed, Square, Heart, Filter, Grid, Map } from 'lucide-react';
import NavigationBar from '@/components/landing/NavigationBar';
import Footer from '@/components/Footer';

// MOCK DATA for Initial Demo (if DB is empty)
const MOCK_PROPERTIES = [
    {
        id: 'mock-1',
        title: 'Luxury Sea View Villa',
        location: 'Chaweng Noi, Koh Samui',
        price: 25000000,
        type: 'sale',
        beds: 4,
        baths: 5,
        area: 450,
        images: [{ url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80' }],
        agent: { name: 'Sarah Realty', image: '' }
    },
    {
        id: 'mock-2',
        title: 'Modern Pool Villa',
        location: 'Bophut',
        price: 120000,
        type: 'rent', // Monthly
        beds: 3,
        baths: 3,
        area: 280,
        images: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80' }],
        agent: { name: 'Kosmoi Estates', image: '' }
    },
    {
        id: 'mock-3',
        title: 'Beachfront Condo',
        location: 'Fisherman Village',
        price: 8500000,
        type: 'sale',
        beds: 2,
        baths: 2,
        area: 110,
        images: [{ url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80' }],
        agent: { name: 'Thai Homes', image: '' }
    }
];

export default function RealEstateHub() {
    const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'rent'
    const [searchTerm, setSearchTerm] = useState('');
    const [priceRange, setPriceRange] = useState('all');

    // Fetch Real Properties from DB
    const { data: realProperties, isLoading } = useQuery({
        queryKey: ['properties', activeTab, searchTerm, priceRange],
        queryFn: async () => {
            let query = supabase.from('properties')
                .select('*, images:property_images(url)')
                .eq('type', activeTab === 'buy' ? 'sale' : 'rent');

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
            }

            // Price filtering logic (Custom Range handling)
            if (priceRange !== 'all') {
                if (priceRange === 'under-5m') query = query.lt('price', 5000000);
                if (priceRange === '5m-15m') query = query.gte('price', 5000000).lte('price', 15000000);
                if (priceRange === '15m-plus') query = query.gt('price', 15000000);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        placeholderData: keepPreviousData
    });

    // Merge Mock Data if DB is empty (for demo)
    // Note: Filtering on mock data is removed in favor of DB truth, 
    // but if we want fallback, we'd need complex logic. 
    // For now, we assume DB usage or fallback to full mock if DB is empty.
    const properties = (realProperties && realProperties.length > 0) ? realProperties : MOCK_PROPERTIES.filter(p => {
        const matchesTab = p.type === (activeTab === 'buy' ? 'sale' : 'rent');
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // const filteredProperties = properties; // No longer needed as 'properties' is the result

    const formatPrice = (price, type) => {
        return new Intl.NumberFormat('en-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price) + (type === 'rent' ? '/mo' : '');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <NavigationBar />

            {/* Hero Section */}
            <div className="relative h-[500px] w-full bg-slate-900 flex items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1600596542815-6ad4c727dd2c?w=1600&q=80"
                    alt="Luxury Villa"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="relative z-10 w-full max-w-4xl px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md">
                        Find Your Dream Home in Paradise
                    </h1>

                    {/* Search Box */}
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl mx-auto">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger value="buy" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Buy</TabsTrigger>
                                <TabsTrigger value="rent" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Rent</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="City, Neighborhood, or Address"
                                    className="pl-10 h-12 text-lg"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={priceRange} onValueChange={setPriceRange}>
                                <SelectTrigger className="w-full md:w-[180px] h-12">
                                    <SelectValue placeholder="Price Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Price</SelectItem>
                                    <SelectItem value="under-5m">Under 5M THB</SelectItem>
                                    <SelectItem value="5m-15m">5M - 15M THB</SelectItem>
                                    <SelectItem value="15m-plus">15M+ THB</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="lg" className="h-12 bg-primary hover:bg-primary/90">
                                Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 py-12 w-full flex-1">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'buy' ? 'Properties for Sale' : 'Properties for Rent'}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
                        <Button variant="outline" size="sm"><Map className="w-4 h-4 mr-2" /> Map View</Button>
                    </div>
                </div>

                {/* Property Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {properties.map((property) => (
                        <Card key={property.id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={property.images?.[0]?.url || 'https://via.placeholder.com/800x600'}
                                    alt={property.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-600 border-none">
                                    {property.type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                                </Badge>
                                <Button size="icon" variant="ghost" className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-red-500 rounded-full">
                                    <Heart className="w-5 h-5" />
                                </Button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                    <p className="text-white font-bold text-2xl">
                                        {formatPrice(property.price, property.type)}
                                    </p>
                                </div>
                            </div>

                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{property.title}</h3>
                                <p className="text-gray-500 flex items-center mb-4 text-sm">
                                    <MapPin className="w-4 h-4 mr-1" /> {property.location}
                                </p>

                                <div className="flex items-center justify-between text-gray-600 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Bed className="w-4 h-4" />
                                        <span className="font-semibold">{property.beds}</span> Beds
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Bath className="w-4 h-4" />
                                        <span className="font-semibold">{property.baths || 2}</span> Baths
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Square className="w-4 h-4" />
                                        <span className="font-semibold">{property.area}</span> m²
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="p-4 bg-gray-50 border-t flex justify-between items-center">
                                <div className="text-xs text-gray-400">Listed by Agent</div>
                                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5">View Details</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}
