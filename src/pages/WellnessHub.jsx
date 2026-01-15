import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { SalesService as CrmService } from '@/services/SalesService';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Heart, Filter, Loader2, Star, Sparkles, MapPin, Clock } from 'lucide-react';
import NavigationBar from '@/components/landing/NavigationBar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Real Data from Supabase

import { useNavigate } from 'react-router-dom';

export default function WellnessHub() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Inquiry State
    const [selectedItem, setSelectedItem] = useState(null);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        date: ''
    });

    // Fetch Wellness from DB
    const { data: wellnessItems = [], isLoading } = useQuery({
        queryKey: ['wellness', activeCategory, searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('service_providers')
                .select('*')
                .eq('category', 'wellness')
                .eq('status', 'active');

            if (activeCategory !== 'all') {
                query = query.eq('sub_category', activeCategory);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Client-side search and mapping
            // Note: For large datasets, search should be server-side or via Edge Function
            let items = data.map(item => ({
                id: item.id,
                title: item.business_name,
                location: item.location,
                price: item.metadata?.price || 0,
                category: item.sub_category || 'wellness',
                duration: item.metadata?.specs || 'Session',
                rating: item.average_rating || 0,
                reviews_count: item.total_reviews || 0,
                images: item.images?.length > 0
                    ? item.images.map(img => img.startsWith('http') ? { url: img } : { url: `https://gzjzeywhqbwppfxqkptf.supabase.co/storage/v1/object/public/provider-images/${img}` })
                    : [{ url: 'https://via.placeholder.com/800x600' }]
            }));

            if (searchTerm) {
                const lowerTerm = searchTerm.toLowerCase();
                items = items.filter(item =>
                    item.title.toLowerCase().includes(lowerTerm) ||
                    item.location.toLowerCase().includes(lowerTerm)
                );
            }

            return items;
        },
        placeholderData: keepPreviousData
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleBookClick = (item) => {
        setSelectedItem(item);
        setInquiryForm({
            name: '',
            email: '',
            phone: '',
            message: `Booking request for ${item.title}`,
            date: new Date().toISOString().split('T')[0]
        });
        setIsInquiryOpen(true);
    };

    const handleInquirySubmit = async () => {
        if (!inquiryForm.name || !inquiryForm.email) {
            toast.error("Details required");
            return;
        }

        setSubmitting(true);
        try {
            // CRM Logic similar to ExperiencesHub
            const pipelines = await CrmService.getPipelines();
            const salesPipeline = pipelines.find(p => p.name === 'General Sales') || pipelines[0];
            let stageId = null;
            if (salesPipeline) {
                const stages = await CrmService.getStages(salesPipeline.id);
                const firstStage = stages.find(s => s.name === 'New Lead') || stages[0];
                if (firstStage) stageId = firstStage.id;
            }

            const leadData = {
                first_name: inquiryForm.name.split(' ')[0],
                last_name: inquiryForm.name.split(' ').slice(1).join(' ') || '',
                email: inquiryForm.email,
                phone: inquiryForm.phone,
                notes: `Wellness Booking: ${selectedItem?.title}\nDate: ${inquiryForm.date}\nMessage: ${inquiryForm.message}`,
                source: 'Wellness Hub',
                stage_id: stageId,
                value: selectedItem?.price || 0
            };

            await CrmService.createLead(leadData);

            toast.success("Request sent! We will contact you shortly.");
            setIsInquiryOpen(false);
        } catch (error) {
            console.error("Booking failed:", error);
            toast.error("Failed to send request.");
        } finally {
            setSubmitting(false);
        }
    };

    const categories = [
        { id: 'all', label: 'All Wellness' },
        { id: 'spa', label: 'Spas & Massage' },
        { id: 'yoga', label: 'Yoga & Detox' },
        { id: 'gym', label: 'Gyms & Fitness' },
        { id: 'medical', label: 'Medical & Health' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <NavigationBar />

            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[500px] w-full bg-slate-900 flex items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80"
                    alt="Wellness"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="relative z-10 w-full max-w-4xl px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md font-display">
                        Rejuvenate Your Body & Mind
                    </h1>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-sm">
                        Discover the best spas, yoga retreats, and fitness centers in Koh Samui.
                    </p>

                    {/* Search Box */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <MapPin className="absolute start-3 top-3.5 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Search spas, yoga, gyms..."
                                    className="ps-10 h-12 text-lg border-transparent bg-gray-50 focus:bg-white transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button size="lg" className="h-12 bg-teal-600 hover:bg-teal-700 w-full md:w-auto px-8 rounded-xl shadow-lg shadow-teal-900/20">
                                Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 py-12 w-full flex-1">

                {/* Category Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id
                                ? 'bg-teal-600 text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeCategory === 'all' ? `All Wellness (${wellnessItems.length})` : categories.find(c => c.id === activeCategory)?.label}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {wellnessItems.map((item) => (
                        <Card key={item.id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                            <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => handleBookClick(item)}>
                                <img
                                    src={item.images?.[0]?.url || 'https://via.placeholder.com/800x600'}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <Badge className="absolute top-4 left-4 bg-teal-600 text-white border-none px-3 py-1 uppercase">
                                    {item.category}
                                </Badge>
                                <Button size="icon" variant="ghost" className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-red-500 rounded-full">
                                    <Heart className="w-5 h-5" />
                                </Button>
                            </div>

                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center text-yellow-500 text-sm font-bold">
                                        <Star className="w-4 h-4 fill-current mr-1" />
                                        {item.rating} <span className="text-gray-400 font-normal ml-1">({item.reviews_count})</span>
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <Sparkles className="w-4 h-4 mr-1" />
                                        {item.duration}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-teal-600 transition-colors">
                                    {item.title}
                                </h3>

                                <p className="text-gray-500 flex items-center mb-4 text-sm">
                                    <MapPin className="w-4 h-4 mr-1" /> {item.location}
                                </p>

                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Starting from</p>
                                        <p className="text-2xl font-bold text-teal-600">
                                            {formatPrice(item.price)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleBookClick(item)}
                                        className="rounded-xl px-6 bg-teal-600 hover:bg-teal-700"
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Footer />

            {/* Booking Dialog */}
            <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Book Wellness Experience</DialogTitle>
                        <DialogDescription>
                            Request a booking for "{selectedItem?.title}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={inquiryForm.name}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                placeholder="Your Name"
                            />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={inquiryForm.email}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={inquiryForm.phone}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={inquiryForm.date}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, date: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Special Requests</Label>
                            <Textarea
                                id="message"
                                value={inquiryForm.message}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={submitting} onClick={handleInquirySubmit} type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
