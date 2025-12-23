import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, MessageCircle, Share2, Heart, User, Calendar, Eye, ShieldCheck, Map as MapIcon, Bed, Bath, Maximize } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Mock Data (In real app, fetch by ID)
const MOCK_PRODUCT = {
    id: 'm2',
    title: 'Luxury Sea View Villa with Infinity Pool',
    price: 25000000,
    description: 'Experience the ultimate island living in this stunning 3-bedroom villa located in the prestigious Chaweng Noi hills. Enjoy breathable panoramic ocean views, a private infinity pool, and modern open-plan living. Just 5 minutes drive to the beach and international schools.\n\nFeatures:\n- Private Infinity Pool\n- Fully Furnished\n- Chanote Title\n- Deep Well Water',
    location: 'Chaweng Noi, Koh Samui',
    category_id: 'real-estate',
    subcategory: 'sale',
    images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80',
        'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=1200&q=80'
    ],
    status: 'active',
    lat: 9.500, lng: 100.04,
    posted_at: '2 days ago',
    views: 124,
    seller: {
        name: 'Sarah Jenkins',
        role: 'Premium Agent',
        joined: '2021',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    specs: {
        bedrooms: 3,
        bathrooms: 3,
        size_sqm: 350,
        land_size: 800,
        type: 'Villa'
    }
};

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    // In real app: const { data: product } = useQuery(...)

    const product = MOCK_PRODUCT; // Fallback
    const isRealEstate = product.category_id === 'real-estate';

    const formatPrice = (price) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header / Nav */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-red-500">
                        <Heart className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-indigo-600">
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
                    <div className="h-[300px] md:h-[400px]">
                        <img src={product.images[0]} className="w-full h-full object-cover md:rounded-l-2xl" alt="Main" />
                    </div>
                    <div className="hidden md:grid grid-cols-2 gap-2 h-[400px]">
                        <img src={product.images[1]} className="w-full h-full object-cover" alt="Detail 1" />
                        <img src={product.images[2]} className="w-full h-full object-cover rounded-r-2xl" alt="Detail 2" />
                        <div className="relative col-span-2">
                            <img src={product.images[0]} className="w-full h-full object-cover filter brightness-50 rounded-br-2xl" alt="More" />
                            <Button variant="secondary" className="absolute inset-0 m-auto w-fit h-fit pointer-events-none">View All Photos</Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 py-6 md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-2 space-y-6">
                        {/* Title & Price */}
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                        {isRealEstate ? `${product.specs.type} • ${product.subcategory}` : product.category_id}
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">
                                        {product.title}
                                    </h1>
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                                        {product.location}
                                        <span className="mx-2">•</span>
                                        <span className="text-slate-400">{product.posted_at}</span>
                                    </div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <div className="text-2xl font-bold text-indigo-600">{formatPrice(product.price)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats (Real Estate) */}
                        {isRealEstate && (
                            <div className="flex justify-around bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="text-center">
                                    <Bed className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                                    <div className="font-bold text-slate-700">{product.specs.bedrooms} Beds</div>
                                </div>
                                <div className="w-px bg-slate-200" />
                                <div className="text-center">
                                    <Bath className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                                    <div className="font-bold text-slate-700">{product.specs.bathrooms} Baths</div>
                                </div>
                                <div className="w-px bg-slate-200" />
                                <div className="text-center">
                                    <Maximize className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                                    <div className="font-bold text-slate-700">{product.specs.size_sqm} m²</div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h3 className="font-bold text-lg mb-3">Description</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>

                        {/* Map Location */}
                        <div className="rounded-2xl overflow-hidden h-[250px] border border-slate-200 relative">
                            <MapContainer center={[product.lat, product.lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[product.lat, product.lng]}>
                                    <Popup>{product.title}</Popup>
                                </Marker>
                            </MapContainer>
                            <Button variant="secondary" className="absolute bottom-4 right-4 z-[400] shadow-md bg-white hover:bg-slate-50 text-indigo-600" onClick={() => window.open(`https://maps.google.com/?q=${product.lat},${product.lng}`)}>
                                <MapIcon className="w-4 h-4 mr-2" /> Open in Google Maps
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar / Seller Info */}
                    <div className="space-y-6 mt-8 md:mt-0">
                        <div className="bg-white md:border border-slate-100 md:shadow-lg md:p-6 md:rounded-2xl sticky top-24">
                            <div className="text-2xl font-bold text-indigo-600 mb-6 md:hidden">{formatPrice(product.price)}</div>

                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                                    <AvatarImage src={product.seller.image} />
                                    <AvatarFallback>SJ</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-lg">{product.seller.name}</div>
                                    <div className="text-sm text-slate-500 flex items-center">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" />
                                        {product.seller.role}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mb-6">
                                <div>
                                    <span className="block text-xs uppercase tracking-wide text-slate-400">Rating</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        <span className="text-yellow-500">★</span> {product.seller.rating}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wide text-slate-400">Member Since</span>
                                    <span className="font-semibold text-slate-800">{product.seller.joined}</span>
                                </div>
                            </div>

                            <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 mb-3">
                                <MessageCircle className="w-5 h-5 mr-2" /> Contact Seller
                            </Button>
                            <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50">
                                Make an Offer
                            </Button>
                        </div>

                        {/* Analytics Tiny Block */}
                        <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {product.views} views
                            </div>
                            <div>ID: {product.id.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
