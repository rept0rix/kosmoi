
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Clock, Users, ArrowRight, Search, Calendar } from 'lucide-react';
import NavigationBar from '@/components/landing/NavigationBar';
import Footer from '@/components/Footer';

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

export default function ExperiencesHub() {
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Adventure', 'Relaxation', 'Culture', 'Nature', 'Water Sports'];

    const filteredExperiences = activeCategory === 'All'
        ? EXPERIENCES
        : EXPERIENCES.filter(e => e.category === activeCategory);

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
                                    <Button size="sm" variant="outline" className="group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition-colors">
                                        View Details
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
        </div>
    );
}
