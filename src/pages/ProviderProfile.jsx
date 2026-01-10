
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/api/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassPanel, GlassButton } from '@/components/ui/glass-kit';
import { MapPin, Star, Phone, Mail, Calendar, ArrowLeft, Share2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookingDialog from '@/components/BookingDialog';
import { ReviewService } from '@/services/ReviewService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/api/supabaseClient';

export default function ProviderProfile() {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    useEffect(() => {
        loadProvider();
    }, [providerId]);

    const loadProvider = async () => {
        setLoading(true);
        // Supabase filter usually returns array
        const { data, error } = await db.entities.ServiceProvider.filter({ id: providerId });
        if (data && data.length > 0) {
            setProvider(data[0]);
        } else {
            console.error("Provider not found", error);
        }
        setLoading(false);
    };

    const loadReviews = async () => {
        setReviewsLoading(true);
        try {
            const data = await ReviewService.getReviews(providerId);
            setReviews(data || []);
        } catch (error) {
            console.error("Failed to load reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (providerId) loadReviews();
    }, [providerId]);

    const handleSubmitReview = async () => {
        if (!user) return; // Should show login prompt strictly but disabled button handles it
        try {
            await ReviewService.addReview(providerId, newRating, newComment);
            setIsReviewOpen(false);
            setNewComment("");
            setNewRating(5);
            loadReviews();
            loadProvider();
        } catch (error) {
            console.error("Failed to submit review:", error);
            alert("Failed to submit review. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h2 className="text-2xl font-bold text-slate-400">Provider Not Found</h2>
                <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950"
        >
            {/* Hero Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <img
                    src={provider.logo_url || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"}
                    alt={provider.business_name}
                    className="w-full h-full object-cover blur-sm brightness-75 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                <div className="absolute top-4 left-4 z-10">
                    {/* @ts-ignore */}
                    <GlassButton onClick={() => navigate(-1)} size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </GlassButton>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-end justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-600/90 text-white px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm">
                                    {provider.category || 'Service'}
                                </span>
                                {provider.badge === 'verified' && (
                                    <span className="bg-emerald-500/90 text-white px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> Verified
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-1 shadow-sm">{provider.business_name}</h1>
                            <div className="flex items-center text-slate-200 text-sm gap-4">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {provider.location || 'Samui, Thailand'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" /> {provider.average_rating ? Number(provider.average_rating).toFixed(1) : 'New'} ({provider.total_reviews || 0} reviews)
                                </span>
                            </div>
                        </div>

                        <div className="hidden md:flex gap-2">
                            {/* @ts-ignore */}
                            <GlassButton size="icon" className="rounded-full bg-white/10 hover:bg-white/20">
                                <Share2 className="w-5 h-5 text-white" />
                            </GlassButton>
                            {/* @ts-ignore */}
                            <GlassButton size="icon" className="rounded-full bg-white/10 hover:bg-white/20">
                                <Heart className="w-5 h-5 text-white" />
                            </GlassButton>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* @ts-ignore */}
                    <GlassCard className="p-6 bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">{t('provider.about') || 'About'}</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {provider.description || "Experience the best service in Koh Samui. We are dedicated to providing top-quality experiences for all our guests. Contact us for more details and specific arrangements."}
                        </p>

                        {/* Amenities */}
                        {provider.amenities && provider.amenities.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3">Amenities & Features</h3>
                                <div className="flex flex-wrap gap-2">
                                    {provider.amenities.map((item, i) => (
                                        <div key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="text-xs text-slate-400 uppercase font-medium">Contact</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Phone className="w-4 h-4 text-blue-500" /> {provider.phone_number || 'N/A'}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="text-xs text-slate-400 uppercase font-medium">Email</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Mail className="w-4 h-4 text-blue-500" /> {provider.email || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Services / Packages */}
                    {provider.price_packages && provider.price_packages.length > 0 && (
                        /* @ts-ignore */
                        <GlassCard className="p-6 bg-white dark:bg-slate-900 border-0 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Services & Pricing</h2>
                            <div className="space-y-4">
                                {provider.price_packages.map((pkg, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 border rounded-xl hover:border-blue-300 bg-slate-50/50 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{pkg.title || 'Service'}</h4>
                                            {pkg.description && <p className="text-sm text-slate-500">{pkg.description}</p>}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-blue-600">
                                                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(pkg.price || 0)}
                                            </div>
                                            <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => {
                                                setSelectedPackage(pkg);
                                                setIsBookingOpen(true);
                                            }}>
                                                Book
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* Gallery */}
                    {provider.images && provider.images.length > 0 && (
                        /* @ts-ignore */
                        <GlassCard className="p-6 bg-white dark:bg-slate-900 border-0 shadow-sm overflow-hidden">
                            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {provider.images.slice(0, 8).map((img, i) => (
                                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* @ts-ignore */}
                    <GlassCard className="p-6 bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('provider.reviews') || 'Reviews'}</h2>

                            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" disabled={!user}>
                                        {user ? "Write a Review" : "Login to Review"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
                                    <DialogHeader>
                                        <DialogTitle>Write a Review</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="rating" className="text-right">
                                                Rating
                                            </Label>
                                            <div className="col-span-3 flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setNewRating(star)}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star
                                                            className={`w-6 h-6 ${star <= newRating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="comment" className="text-right">
                                                Comment
                                            </Label>
                                            <Textarea
                                                id="comment"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="col-span-3"
                                                placeholder="Share your experience..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleSubmitReview}>Submit Review</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {reviewsLoading ? (
                            <div className="text-center py-8 text-slate-400">Loading reviews...</div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                No reviews yet. Be the first to review!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <Avatar>
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${review.user_id}`} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">
                                                    {review.user?.raw_user_meta_data?.full_name || 'Verified User'}
                                                </span>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, j) => (
                                                        <Star
                                                            key={j}
                                                            className={`w-3 h-3 ${j < review.rating ? 'fill-current' : 'text-slate-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {review.comment}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Right Column: Sticky Booking & Map */}
                <div className="hidden md:block md:col-span-1 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        {/* @ts-ignore */}
                        <GlassCard className="p-6 border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                            <h3 className="text-lg font-semibold mb-2">Book Your Slot</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Instant confirmation. No booking fees.
                            </p>
                            <Button onClick={() => {
                                setIsBookingOpen(true);
                                setSelectedPackage(null);
                            }} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-medium shadow-lg shadow-blue-500/20">
                                Book Now
                            </Button>
                            <p className="text-xs text-center text-slate-400 mt-4">
                                You won't be charged yet.
                            </p>
                        </GlassCard>

                        <div className="h-64 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative bg-slate-100">
                            {/* Placeholder Map - In real app, integrate Leaflet/Google Maps */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                                <div className="text-center">
                                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-sm">Map View Placeholder</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Booking Bar */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-40 flex items-center justify-between safe-area-bottom">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Starting from</span>
                    <span className="font-bold text-lg text-blue-600">
                        {provider.price_packages && provider.price_packages.length > 0
                            ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Math.min(...provider.price_packages.map(p => p.price)))
                            : 'Contact for price'}
                    </span>
                </div>
                <Button onClick={() => {
                    setIsBookingOpen(true);
                    setSelectedPackage(null);
                }} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 px-8">
                    Book Now
                </Button>
            </div>

            <BookingDialog
                open={isBookingOpen}
                onOpenChange={setIsBookingOpen}
                provider={provider}
                selectedPackage={selectedPackage}
                onBookingConfirmed={() => {
                    setIsBookingOpen(false);
                    setSelectedPackage(null);
                    // Could add toast here: toast("Booking Request Sent!");
                }}
            />
        </motion.div>
    );
}
