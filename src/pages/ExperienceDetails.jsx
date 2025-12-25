
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { SalesService as CrmService } from '@/services/SalesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Users, Star, Check, Info, Calendar, ChevronLeft, Share2, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// EXTENDED MOCK DATA with rich details
const MOCK_EXPERIENCES_DETAILS = {
    'exp-1': {
        id: 'exp-1',
        title: 'Ang Thong Marine Park Safari',
        location: 'Nathon Pier',
        price: 2500,
        category: 'adventure',
        duration: '8 hours',
        rating: 4.8,
        reviews_count: 124,
        images: ['https://images.unsplash.com/photo-1534008897995-27a23e859048?w=1600&q=80', 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80'],
        description: "Explore the 42 islands of Ang Thong National Marine Park. Snorkel in crystal clear waters, hike to the Emerald Lake, and kayak along limestone cliffs. A full day of adventure and natural beauty.",
        schedule: "08:00 - 16:30",
        inclusions: [
            "Hotel transfer (Round trip)",
            "Light Breakfast",
            "Buffet Lunch",
            "Snorkeling equipment",
            "Kayaking",
            "National Park Entrance Fee",
            "English speaking guide"
        ],
        important_info: [
            "Bring sunscreen and a hat",
            "Not recommended for pregnant women",
            "Vegetarian options available upon request"
        ],
        highlights: [
            "Visit the famous Emerald Lake (Talay Nai)",
            "Snorkel at Wua Ta Lap island",
            "Sea Kayaking through hidden caves"
        ]
    },
    'exp-2': {
        id: 'exp-2',
        title: 'Authentic Thai Cooking Class',
        location: 'Bophut',
        price: 1800,
        category: 'food',
        duration: '4 hours',
        rating: 4.9,
        reviews_count: 85,
        images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80'],
        description: "Master the art of Thai cuisine with our expert local chefs. Visit the local market to pick fresh ingredients, then learn to cook 4 classic dishes from scratch.",
        schedule: "10:00 - 14:00 or 16:00 - 20:00",
        inclusions: [
            "Market tour",
            "Cooking ingredients",
            "Recipe book",
            "Certificate",
            "Enjoy your own meal"
        ],
        important_info: [
            "Please inform us of any food allergies",
            "Suitable for beginners"
        ],
        highlights: [
            "Local market experience",
            "Hands-on cooking in a traditional kitchen",
            "Make your own curry paste"
        ]
    },
    // Fallback template for others
    'default': {
        description: "Experience the best of Koh Samui with this curated activity. Enjoy local culture, breathtaking views, and professional service.",
        schedule: "Flexible",
        inclusions: ["Professional Guide", "Standard Safety Equipment", "Water provided"],
        important_info: ["Comfortable clothing recommended", "Bring your camera"],
        highlights: ["Local sightseeing", "Cultural immersion", "Photo opportunities"]
    }
};

export default function ExperienceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [experience, setExperience] = useState(null);
    const [loading, setLoading] = useState(true);

    // Booking Form State
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        email: '',
        phone: '',
        guests: 2,
        date: '',
        message: ''
    });

    useEffect(() => {
        const fetchExperience = async () => {
            setLoading(true);
            try {
                // 1. Try DB
                const { data, error } = await supabase
                    .from('experiences')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data && !error) {
                    // Enrich DB data with default details if missing specific columns
                    // In a real app, we'd store these as JSONB in the DB
                    setExperience({
                        ...data,
                        images: data.image_url ? [data.image_url] : ['https://via.placeholder.com/800'],
                        ...MOCK_EXPERIENCES_DETAILS['default'] // Fallback for extra fields
                    });
                } else {
                    // 2. Fallback to Mock
                    const mock = MOCK_EXPERIENCES_DETAILS[id] || MOCK_EXPERIENCES_DETAILS[Object.keys(MOCK_EXPERIENCES_DETAILS).find(k => k.startsWith(id))] || null;
                    if (mock) {
                        setExperience(mock);
                    } else {
                        // Attempt to find generic info in the main array logic from Hub (simplified here)
                        // If completely unknown ID and not in DB:
                        if (id.startsWith('exp-')) {
                            // Use default template with ID
                            setExperience({
                                id,
                                title: 'Unknown Experience',
                                price: 0,
                                ...MOCK_EXPERIENCES_DETAILS['default']
                            })
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [id]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleBookingSubmit = async () => {
        if (!inquiryForm.name || !inquiryForm.email) {
            toast.error(t('favorites.login_desc') || "Details required");
            return;
        }
        setSubmitting(true);
        try {
            // Create Lead Logic (Same as Hub)
            const leadData = {
                first_name: inquiryForm.name.split(' ')[0],
                last_name: inquiryForm.name.split(' ').slice(1).join(' ') || '',
                email: inquiryForm.email,
                phone: inquiryForm.phone,
                notes: `Deep Booking Request: ${experience?.title}\nDate: ${inquiryForm.date}\nGuests: ${inquiryForm.guests}\nMessage: ${inquiryForm.message}`,
                source: 'Experience Details',
                value: experience?.price ? experience.price * inquiryForm.guests : 0
            };
            await CrmService.createLead(leadData);
            toast.success(t('experiences.inquiry_success'));
            setIsBookingOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Booking Error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    if (!experience) return <div className="flex h-screen items-center justify-center">Experience Not Found</div>;

    return (
        <div className="min-h-screen bg-white">
            <NavigationBar />

            <main className="pb-24">
                {/* 1. Gallery / Hero */}
                <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden bg-gray-100">
                    <img
                        src={experience.images[0]}
                        alt={experience.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 z-10">
                        <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={() => navigate(-1)}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN: Content */}
                        <div className="lg:col-span-2">
                            <Card className="border-none shadow-lg rounded-3xl overflow-hidden mb-8">
                                <CardContent className="p-6 md:p-8">
                                    {/* Header */}
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                        <div>
                                            <Badge variant="secondary" className="mb-2 uppercase tracking-wide text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20">{t(`experiences.category_${experience.category}`) || experience.category}</Badge>
                                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-display mb-2">{experience.title}</h1>
                                            <div className="flex items-center text-gray-500 text-sm gap-4">
                                                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {experience.location}</span>
                                                <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" /> {experience.rating} ({experience.reviews_count} reviews)</span>
                                            </div>
                                        </div>
                                        {/* Actions (Share/Like) */}
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                                            <Button variant="outline" size="icon" className="rounded-full"><Heart className="w-4 h-4" /></Button>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    {/* Key Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <Clock className="w-5 h-5 text-primary mb-2" />
                                            <div className="text-xs text-gray-500 uppercase">{t('experiences.duration')}</div>
                                            <div className="font-semibold">{experience.duration}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <Users className="w-5 h-5 text-primary mb-2" />
                                            <div className="text-xs text-gray-500 uppercase">Max Group</div>
                                            <div className="font-semibold">10-15</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <Calendar className="w-5 h-5 text-primary mb-2" />
                                            <div className="text-xs text-gray-500 uppercase">Availability</div>
                                            <div className="font-semibold">Daily</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <Info className="w-5 h-5 text-primary mb-2" />
                                            <div className="text-xs text-gray-500 uppercase">Guide</div>
                                            <div className="font-semibold">English</div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold mb-4 font-display">About this activity</h3>
                                        <p className="text-gray-600 leading-relaxed text-lg">{experience.description}</p>
                                    </div>

                                    {/* Highlights */}
                                    {experience.highlights && (
                                        <div className="mb-8">
                                            <h3 className="text-xl font-bold mb-4 font-display">Highlights</h3>
                                            <ul className="grid gap-3">
                                                {experience.highlights.map((item, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                                                        <span className="text-gray-700">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Inclusions */}
                                        {experience.inclusions && (
                                            <div>
                                                <h3 className="text-lg font-bold mb-4 font-display">What's included</h3>
                                                <ul className="grid gap-2">
                                                    {experience.inclusions.map((item, i) => (
                                                        <li key={i} className="flex items-start">
                                                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1" />
                                                            <span className="text-gray-600 text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {/* Info / Rules */}
                                        {experience.important_info && (
                                            <div>
                                                <h3 className="text-lg font-bold mb-4 font-display">Things to know</h3>
                                                <ul className="grid gap-2">
                                                    {experience.important_info.map((item, i) => (
                                                        <li key={i} className="flex items-start">
                                                            <AlertCircle className="w-4 h-4 text-amber-500 mr-2 mt-1" />
                                                            <span className="text-gray-600 text-sm">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Schedule */}
                                    {experience.schedule && (
                                        <div className="mt-8 p-4 border border-blue-100 bg-blue-50/50 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="p-3 bg-white rounded-full shadow-sm"><Clock className="w-6 h-6 text-blue-500" /></div>
                                            <div>
                                                <div className="font-bold text-blue-900">Schedule / Hours</div>
                                                <div className="text-blue-700">{experience.schedule}</div>
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Booking Card (Sticky) */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <Card className="border-none shadow-xl rounded-2xl overflow-hidden ring-1 ring-gray-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-end gap-2 mb-6">
                                            <span className="text-3xl font-bold text-primary">{formatPrice(experience.price)}</span>
                                            <span className="text-gray-500 mb-1.5">{t('experiences.price_person')}</span>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-primary transition-colors">
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm"
                                                    onChange={e => setInquiryForm({ ...inquiryForm, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-primary transition-colors">
                                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Guests</label>
                                                <div className="flex items-center justify-between">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setInquiryForm(p => ({ ...p, guests: Math.max(1, p.guests - 1) }))}>-</Button>
                                                    <span className="font-semibold">{inquiryForm.guests}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setInquiryForm(p => ({ ...p, guests: p.guests + 1 }))}>+</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 mb-6">
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="text-gray-600">{formatPrice(experience.price)} x {inquiryForm.guests}</span>
                                                <span className="font-semibold">{formatPrice(experience.price * inquiryForm.guests)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-lg font-bold">
                                                <span>Total</span>
                                                <span>{formatPrice(experience.price * inquiryForm.guests)}</span>
                                            </div>
                                        </div>

                                        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="lg" className="w-full text-lg h-12 shadow-lg shadow-primary/20 rounded-xl">
                                                    {t('experiences.book_btn')}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Confirm Booking Request</DialogTitle>
                                                    <DialogDescription>Enter your details to request this booking. No payment is charged yet.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>Full Name</Label>
                                                        <Input placeholder="John Doe" value={inquiryForm.name} onChange={e => setInquiryForm({ ...inquiryForm, name: e.target.value })} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Email</Label>
                                                        <Input type="email" placeholder="john@example.com" value={inquiryForm.email} onChange={e => setInquiryForm({ ...inquiryForm, email: e.target.value })} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Phone / WhatsApp</Label>
                                                        <Input placeholder="+66..." value={inquiryForm.phone} onChange={e => setInquiryForm({ ...inquiryForm, phone: e.target.value })} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Special Requests</Label>
                                                        <Textarea placeholder="Dietary requirements, pick-up location..." value={inquiryForm.message} onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })} />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleBookingSubmit} disabled={submitting} className="w-full">
                                                        {submitting ? <Loader2 className="animate-spin" /> : "Submit Request"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <div className="mt-4 text-center">
                                            <span className="text-xs text-gray-400">Free cancellation up to 24h before</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function Loader2({ className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
}
