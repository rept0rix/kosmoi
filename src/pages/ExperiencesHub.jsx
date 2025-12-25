
import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { SalesService as CrmService } from '@/services/SalesService';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, Heart, Filter, Loader2, Star } from 'lucide-react';
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

// MOCK DATA for Demo
const MOCK_EXPERIENCES = [
    {
        id: 'exp-1',
        title: 'Ang Thong Marine Park Safari',
        location: 'Nathon Pier',
        price: 2500,
        category: 'adventure',
        duration: '8 hours',
        rating: 4.8,
        reviews_count: 124,
        images: [{ url: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80' }]
    },
    {
        id: 'exp-2',
        title: 'Authentic Thai Cooking Class',
        location: 'Bophut',
        price: 1800,
        category: 'food',
        duration: '4 hours',
        rating: 4.9,
        reviews_count: 85,
        images: [{ url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80' }]
    },
    {
        id: 'exp-3',
        title: 'Sunrise Yoga on the Beach',
        location: 'Lamai Beach',
        price: 500,
        category: 'nature',
        duration: '1.5 hours',
        rating: 4.7,
        reviews_count: 42,
        images: [{ url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80' }]
    },
    {
        id: 'exp-4',
        title: 'Jungle Jeep 4x4 Tour',
        location: 'Maenam',
        price: 1900,
        category: 'adventure',
        duration: '6 hours',
        rating: 4.6,
        reviews_count: 210,
        images: [{ url: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800&q=80' }]
    },
    {
        id: 'exp-5',
        title: 'Private Sunset Cruise',
        location: 'Bangrak',
        price: 15000,
        category: 'nightlife',
        duration: '3 hours',
        rating: 5.0,
        reviews_count: 18,
        images: [{ url: 'https://images.unsplash.com/photo-1520645521318-f03a712f0e67?w=800&q=80' }]
    },
    {
        id: 'exp-6',
        title: 'Big Buddha & Temple Tour',
        location: 'Plai Laem',
        price: 1200,
        category: 'culture',
        duration: '4 hours',
        rating: 4.5,
        reviews_count: 150,
        images: [{ url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80' }]
    }
];

import { useNavigate } from 'react-router-dom';

export default function ExperiencesHub() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Inquiry State
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        guests: 2,
        date: ''
    });

    // Fetch Experiences from DB
    const { data: dbExperiences, isLoading } = useQuery({
        queryKey: ['experiences', activeCategory, searchTerm],
        queryFn: async () => {
            // Ensure 'experiences' table exists or this will fail gracefully
            let query = supabase.from('experiences').select('*');

            if (activeCategory !== 'all') {
                query = query.eq('category', activeCategory);
            }

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) {
                // If table doesn't exist yet, return null to use mock data
                console.warn("Error fetching experiences (using mock data):", error);
                return null;
            }
            return data;
        },
        placeholderData: keepPreviousData
    });

    // Merge Mock Data
    const experiences = (dbExperiences && dbExperiences.length > 0) ? dbExperiences : MOCK_EXPERIENCES.filter(e => {
        const matchesCategory = activeCategory === 'all' || e.category === activeCategory;
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleBookClick = (experience) => {
        setSelectedExperience(experience);
        setInquiryForm({
            name: '',
            email: '',
            phone: '',
            message: `Booking request for ${experience.title}`,
            guests: 2,
            date: new Date().toISOString().split('T')[0]
        });
        setIsInquiryOpen(true);
    };

    const handleInquirySubmit = async () => {
        if (!inquiryForm.name || !inquiryForm.email) {
            toast.error(t('favorites.login_desc') || "Details required"); // Fallback
            return;
        }

        setSubmitting(true);
        try {
            // 1. Get Pipeline
            const pipelines = await CrmService.getPipelines();
            const salesPipeline = pipelines.find(p => p.name === 'General Sales') || pipelines[0];

            let stageId = null;
            if (salesPipeline) {
                const stages = await CrmService.getStages(salesPipeline.id);
                const firstStage = stages.find(s => s.name === 'New Lead') || stages[0];
                if (firstStage) stageId = firstStage.id;
            }

            // 2. Create Lead
            const leadData = {
                first_name: inquiryForm.name.split(' ')[0],
                last_name: inquiryForm.name.split(' ').slice(1).join(' ') || '',
                email: inquiryForm.email,
                phone: inquiryForm.phone,
                notes: `Experience Booking: ${selectedExperience?.title} (${selectedExperience?.duration})\nDate: ${inquiryForm.date}\nGuests: ${inquiryForm.guests}\nMessage: ${inquiryForm.message}`,
                source: 'Experiences Hub',
                stage_id: stageId,
                value: selectedExperience?.price ? selectedExperience.price * inquiryForm.guests : 0
            };

            await CrmService.createLead(leadData);

            toast.success(t('experiences.inquiry_success'));
            setIsInquiryOpen(false);
        } catch (error) {
            console.error("Booking failed:", error);
            toast.error(t('provider.error_generic'));
        } finally {
            setSubmitting(false);
        }
    };

    const categories = [
        { id: 'all', label: t('experiences.category_all') },
        { id: 'adventure', label: t('experiences.category_adventure') },
        { id: 'food', label: t('experiences.category_food') },
        { id: 'culture', label: t('experiences.category_culture') },
        { id: 'nature', label: t('experiences.category_nature') },
        { id: 'nightlife', label: t('experiences.category_nightlife') },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <NavigationBar />

            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[500px] w-full bg-slate-900 flex items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80"
                    alt="Experiences"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="relative z-10 w-full max-w-4xl px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md font-display">
                        {t('experiences.hero_title')}
                    </h1>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-sm">
                        {t('experiences.hero_subtitle')}
                    </p>

                    {/* Search Box */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <MapPin className="absolute start-3 top-3.5 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder={t('experiences.search_placeholder')}
                                    className="ps-10 h-12 text-lg border-transparent bg-gray-50 focus:bg-white transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button size="lg" className="h-12 bg-primary hover:bg-primary/90 w-full md:w-auto px-8 rounded-xl shadow-lg shadow-primary/20">
                                {t('nav.search')}
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
                                ? 'bg-primary text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeCategory === 'all' ? t('search.results_found', { count: experiences.length }) : categories.find(c => c.id === activeCategory)?.label}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('search.clear_filters')}</Button>
                    </div>
                </div>

                {/* Experience Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {experiences.map((experience) => (
                        <Card key={experience.id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                            <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => navigate(`/experiences/${experience.id}`)}>
                                <img
                                    src={experience.images?.[0]?.url || experience.images?.[0] || 'https://via.placeholder.com/800x600'}
                                    alt={experience.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <Badge className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white border-none px-3 py-1">
                                    {t(`experiences.category_${experience.category}`) || experience.category}
                                </Badge>
                                <Button size="icon" variant="ghost" className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-red-500 rounded-full">
                                    <Heart className="w-5 h-5" />
                                </Button>
                            </div>

                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center text-yellow-500 text-sm font-bold">
                                        <Star className="w-4 h-4 fill-current mr-1" />
                                        {experience.rating} <span className="text-gray-400 font-normal ml-1">({experience.reviews_count})</span>
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {experience.duration}
                                    </div>
                                </div>

                                <h3
                                    className="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-primary transition-colors cursor-pointer"
                                    onClick={() => navigate(`/experiences/${experience.id}`)}
                                >
                                    {experience.title}
                                </h3>

                                <p className="text-gray-500 flex items-center mb-4 text-sm">
                                    <MapPin className="w-4 h-4 mr-1" /> {experience.location}
                                </p>

                                <div className="flex items-center justify-between mt-4">
                                    <div onClick={() => navigate(`/experiences/${experience.id}`)} className="cursor-pointer">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('experiences.price_person')}</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {formatPrice(experience.price)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBookClick(experience);
                                        }}
                                        className="rounded-xl px-6"
                                    >
                                        {t('experiences.book_btn')}
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
                        <DialogTitle>{t('experiences.inquiry_title')}</DialogTitle>
                        <DialogDescription>
                            {t('experiences.inquiry_desc')} "{selectedExperience?.title}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('businessName') || "Name"}</Label>
                            <Input
                                id="name"
                                value={inquiryForm.name}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={inquiryForm.email}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">{t('phone')}</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={inquiryForm.phone}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                    placeholder="+66..."
                                />
                            </div>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t('experiences.guests')}</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={inquiryForm.guests}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, guests: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={inquiryForm.date}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="message">{t('description')}</Label>
                            <Textarea
                                id="message"
                                value={inquiryForm.message}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={submitting} onClick={handleInquirySubmit} type="submit" className="w-full">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('experiences.book_btn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
