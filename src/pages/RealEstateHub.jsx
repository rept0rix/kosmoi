

import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { CrmService } from '@/services/business/CrmService'; // Import CRM Service
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MapPin, Bath, Bed, Square, Heart, Filter, Grid, Map, Loader2 } from 'lucide-react';
import NavigationBar from '@/components/landing/NavigationBar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

    // Inquiry State
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

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
    const properties = (realProperties && realProperties.length > 0) ? realProperties : MOCK_PROPERTIES.filter(p => {
        const matchesTab = p.type === (activeTab === 'buy' ? 'sale' : 'rent');
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const formatPrice = (price, type) => {
        return new Intl.NumberFormat('en-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price) + (type === 'rent' ? '/mo' : '');
    };

    const handleInquiryClick = (property) => {
        setSelectedProperty(property);
        setInquiryForm({
            name: '',
            email: '',
            phone: '',
            message: `I'm interested in ${property.title}. Please send me more details.`
        });
        setIsInquiryOpen(true);
    };

    const handleInquirySubmit = async () => {
        if (!inquiryForm.name || !inquiryForm.email) {
            toast.error("Name and Email are required");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Get Pipeline (for Stage ID) - ideally cached or optimized
            const pipelines = await CrmService.getPipelines();
            const salesPipeline = pipelines.find(p => p.name === 'General Sales') || pipelines[0];

            let stageId = null;
            if (salesPipeline) {
                const stages = await CrmService.getStages(salesPipeline.id);
                // Look for 'New Lead' or first stage
                const firstStage = stages.find(s => s.name === 'New Lead') || stages[0];
                if (firstStage) stageId = firstStage.id;
            }

            // 2. Create Lead
            const leadData = {
                first_name: inquiryForm.name.split(' ')[0],
                last_name: inquiryForm.name.split(' ').slice(1).join(' ') || '',
                email: inquiryForm.email,
                phone: inquiryForm.phone,
                notes: `Inquiry for Property: ${selectedProperty?.title} (${selectedProperty?.location})\n\nMessage: ${inquiryForm.message}`,
                source: 'Real Estate Hub',
                stage_id: stageId,
                value: selectedProperty?.price ? (selectedProperty.type === 'rent' ? selectedProperty.price * 12 : selectedProperty.price * 0.03) : 0 // Est. Commission or Value
            };

            await CrmService.createLead(leadData);

            toast.success("Inquiry sent! An agent will contact you shortly.");
            setIsInquiryOpen(false);
        } catch (error) {
            console.error("Inquiry failed:", error);
            toast.error("Failed to send inquiry.");
        } finally {
            setSubmitting(false);
        }
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
                                <Button
                                    size="sm"
                                    className="border-primary bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => handleInquiryClick(property)}
                                >
                                    Contact Agent
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            <Footer />

            {/* Inquiry Dialog */}
            <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Contact Agent</DialogTitle>
                        <DialogDescription>
                            Inquire about "{selectedProperty?.title}". We'll get back to you shortly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={inquiryForm.name}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={inquiryForm.email}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={inquiryForm.phone}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                value={inquiryForm.message}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={submitting} onClick={handleInquirySubmit} type="submit" className="bg-indigo-600 hover:bg-indigo-700 w-full">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Inquiry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

