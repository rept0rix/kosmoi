
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Clock, Users, ArrowRight, Search, Calendar, Loader2 } from 'lucide-react';
import NavigationBar from '@/components/landing/NavigationBar';
import Footer from '@/components/Footer';
import { CrmService } from '@/services/business/CrmService';
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

// MOCK DATA: Experiences
const EXPERIENCES = [
    {
        id: 'exp-1',
        title: 'Ang Thong Marine Park Full Day',
        price: 1800,
        rating: 4.9,
        reviews: 245,
        duration: '8 Hours',
        image: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80',
        category: 'Adventure'
    },
    {
        id: 'exp-2',
        title: 'Ethical Elephant Sanctuary',
        price: 2500,
        rating: 5.0,
        reviews: 180,
        duration: '4 Hours',
        image: 'https://images.unsplash.com/photo-1585970280421-2e3fb731c362?w=800&q=80',
        category: 'Nature'
    },
    {
        id: 'exp-3',
        title: 'Sunset Dinner Cruise',
        price: 3200,
        rating: 4.8,
        reviews: 120,
        duration: '3 Hours',
        image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80',
        category: 'Relaxation'
    },
    {
        id: 'exp-4',
        title: 'Thai Cooking Class',
        price: 1500,
        rating: 4.7,
        reviews: 95,
        duration: '3 Hours',
        image: 'https://images.unsplash.com/photo-1566559535070-d9da8dd74521?w=800&q=80',
        category: 'Culture'
    },
];

import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export default function ExperiencesHub() {
    const [activeCategory, setActiveCategory] = useState('All');

    // Inquiry State
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        guests: 2,
        message: ''
    });

    const handleBookClick = (exp) => {
        setSelectedExperience(exp);
        setInquiryForm({
            name: '',
            email: '',
            phone: '',
            date: '',
            guests: 2,
            message: `I'd like to book ${exp.title}.`
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
            // 1. Get Pipeline (for Stage ID)
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
                notes: `Booking Request for: ${selectedExperience?.title}\nCategory: ${selectedExperience?.category}\nDate: ${inquiryForm.date}\nGuests: ${inquiryForm.guests}\n\nMessage: ${inquiryForm.message}`,
                source: 'Experiences Hub',
                stage_id: stageId,
                value: selectedExperience?.price ? (selectedExperience.price * inquiryForm.guests) : 0
            };

            await CrmService.createLead(leadData);

            toast.success("Booking request sent! We will confirm availability shortly.");
            setIsInquiryOpen(false);
        } catch (error) {
            console.error("Booking failed:", error);
            toast.error("Failed to send request.");
        } finally {
            setSubmitting(false);
        }
    };

    const categories = ['All', 'Adventure', 'Relaxation', 'Culture', 'Nature', 'Water Sports'];

    // Fetch from DB
    const { data: realExperiences, isLoading } = useQuery({
        queryKey: ['experiences'],
        queryFn: async () => {
            const { data, error } = await supabase.from('experiences')
                .select('*, image:image_url, reviews:reviews_count')
                .eq('category', activeCategory === 'All' ? '*' : activeCategory);
            // Note: simple filtering here, or client side. 
            // Let's fetch ALL for client side filtering to match current behavior for simplicity

            const { data: allData, error: allError } = await supabase.from('experiences')
                .select('*, image:image_url, reviews:reviews_count');

            if (allError) throw allError;
            return allData;
        }
    });

    const experiences = (realExperiences && realExperiences.length > 0) ? realExperiences : EXPERIENCES;

    const filteredExperiences = activeCategory === 'All'
        ? experiences
        : experiences.filter(e => e.category === activeCategory);

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            <NavigationBar />

            {/* Hero Section */}
            <div className="relative h-[60vh] overflow-hidden">
                <video
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    poster="https://images.unsplash.com/photo-1589394815804-984bb00b65ce?w=1600"
                >
                    {/* Use a placeholder video or image if real video not available */}
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-beach-waves-loop-video-1216-large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-xl"
                    >
                        Unforgettable Experiences
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-white/90 mb-10 max-w-2xl"
                    >
                        Discover top-rated tours, activities, and hidden gems in Koh Samui.
                        Book instantly with Kosmoi Pay.
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-full p-2 pl-6 flex items-center w-full max-w-2xl shadow-2xl"
                    >
                        <Search className="text-gray-400 w-5 h-5 mr-3" />
                        <input
                            type="text"
                            placeholder="What do you want to do?"
                            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
                        />
                        <div className="h-8 w-[1px] bg-gray-200 mx-2" />
                        <div className="flex items-center gap-2 px-4 text-gray-500 cursor-pointer hover:text-gray-800">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Dates</span>
                        </div>
                        <Button size="lg" className="rounded-full px-8 bg-rose-500 hover:bg-rose-600">
                            Search
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-7xl mx-auto px-4 py-8 w-full">
                <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={activeCategory === cat ? 'default' : 'outline'}
                            onClick={() => setActiveCategory(cat)}
                            className={`rounded-full ${activeCategory === cat ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-16 w-full flex-1">
                <h2 className="text-2xl font-bold mb-8">Top Rated in Samui</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredExperiences.map(exp => (
                        <Card key={exp.id} className="group border-none shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                                <img
                                    src={exp.image}
                                    alt={exp.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold shadow-sm">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {exp.rating} <span className="text-gray-400 font-normal">({exp.reviews})</span>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="text-xs text-rose-500 font-semibold mb-1 uppercase tracking-wide">{exp.category}</div>
                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 h-12 leading-tight">
                                    {exp.title}
                                </h3>
                                <div className="flex items-center text-gray-500 text-sm mb-4">
                                    <Clock className="w-4 h-4 mr-1" /> {exp.duration}
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                    <div>
                                        <span className="text-xs text-gray-400 block">From</span>
                                        <span className="font-bold text-lg text-gray-900">฿{exp.price}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                                        onClick={() => handleBookClick(exp)}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Banner */}
                <div className="mt-16 bg-slate-900 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                    <div className="relative z-10 max-w-xl">
                        <h3 className="text-3xl font-bold text-white mb-4">Curated by Locals, Powered by AI</h3>
                        <p className="text-slate-300 mb-8">
                            Our AI concierge suggests experiences based on your preferences and previous trips.
                            Get personalized itineraries in seconds.
                        </p>
                        <Button size="lg" variant="secondary">Try AI Planner</Button>
                    </div>
                    <img
                        src="https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800"
                        className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 hidden md:block"
                    />
                </div>

            </div>

            <Footer />

            {/* Booking Dialog */}
            <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Book Experience</DialogTitle>
                        <DialogDescription>
                            Request a booking for "{selectedExperience?.title}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={inquiryForm.name}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={inquiryForm.email}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={inquiryForm.phone}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                    placeholder="+1 234..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Preferred Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={inquiryForm.date}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, date: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="guests">Guests</Label>
                                <Input
                                    id="guests"
                                    type="number"
                                    min={1}
                                    value={inquiryForm.guests}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, guests: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Special Requests</Label>
                            <Textarea
                                id="message"
                                value={inquiryForm.message}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={submitting} onClick={handleInquirySubmit} type="submit" className="bg-rose-500 hover:bg-rose-600 w-full text-white">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
