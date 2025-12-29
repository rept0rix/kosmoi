import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Tag, ChevronDown, ChevronRight, X, LayoutGrid, Box, Map as MapIcon, List, Home, Car, Smartphone, Sofa } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MarketplaceService } from '@/services/MarketplaceService';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { CreateListingDialog } from '@/components/marketplace/CreateListingDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MARKETPLACE_CATEGORIES } from '@/data/marketplaceData';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

var DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MOCK_PRODUCTS = [
    {
        id: 'm1',
        title: 'Honda Click 160cc (2023)',
        price: 45000,
        description: 'Perfect condition, low mileage. Green book ready.',
        location: 'Chaweng',
        category_id: 'vehicles',
        subcategory: 'motorbikes',
        images: [{ url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80' }],
        status: 'active',
        lat: 9.512, lng: 100.05
    },
    {
        id: 'm2',
        title: 'Luxury Sea View Villa',
        price: 25000000,
        description: '3 Bedroom villa with panoramic ocean views.',
        location: 'Chaweng Noi',
        category_id: 'real-estate',
        subcategory: 'sale',
        images: [{ url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80' }],
        status: 'active',
        lat: 9.500, lng: 100.04
    },
    {
        id: 'm3',
        title: 'iPhone 14 Pro Max - 256GB',
        price: 28900,
        description: 'Deep Purple, no scratches, battery 95%.',
        location: 'Lamai',
        category_id: 'electronics',
        subcategory: 'phones',
        images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80' }],
        status: 'active',
        lat: 9.45, lng: 100.03
    },
    {
        id: 'm4',
        title: 'L-Shape Sofa (Grey)',
        price: 8500,
        description: 'Comfortable sofa, moving out sale. Must pick up.',
        location: 'Bophut',
        category_id: 'furniture',
        images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80' }],
        status: 'active',
        lat: 9.55, lng: 100.02
    },
    {
        id: 'm-ark',
        title: 'Ark Bar Beach Club VIP Table',
        price: 5000,
        description: 'Premium VIP table package at the famous Ark Bar Beach Club. Includes bottle service and best view.',
        location: 'Chaweng Beach',
        category_id: 'services',
        subcategory: 'entertainment',
        images: [{ url: 'https://images.unsplash.com/photo-1544422116-2d1d02c2f623?w=800&q=80' }],
        status: 'active',
        lat: 9.532, lng: 100.06
    },
    {
        id: 'm5',
        title: 'Toyota Fortuner 2018',
        price: 950000,
        description: 'Well maintained, diesel engine, pure white.',
        location: 'Maenam',
        category_id: 'vehicles',
        subcategory: 'cars',
        images: [{ url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' }],
        status: 'active',
        lat: 9.57, lng: 99.99
    }
];

// Re-usable Filter Component
const FilterBar = ({ activeCategory }) => {
    if (!activeCategory) return null;

    // Real Estate Filters
    if (activeCategory.id === 'real-estate') {
        return (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Select>
                    <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200">
                        <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="0-5m">0 - 5M THB</SelectItem>
                        <SelectItem value="5m-15m">5M - 15M THB</SelectItem>
                        <SelectItem value="15m+">15M+ THB</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="w-[120px] h-9 bg-white border-slate-200">
                        <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="1">1 Bedroom</SelectItem>
                        <SelectItem value="2">2 Bedrooms</SelectItem>
                        <SelectItem value="3+">3+ Bedrooms</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="w-[120px] h-9 bg-white border-slate-200">
                        <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="sea">Sea View</SelectItem>
                        <SelectItem value="garden">Garden View</SelectItem>
                        <SelectItem value="city">City View</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // Vehicle Filters
    if (activeCategory.id === 'vehicles') {
        return (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Select>
                    <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200">
                        <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="low">Under 50k</SelectItem>
                        <SelectItem value="mid">50k - 500k</SelectItem>
                        <SelectItem value="high">500k+</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200">
                        <SelectValue placeholder="Transmission" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="auto">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        )
    }

    return null;
};

// Section Component for "Home View"
// Section Component for "Home View"
const CategorySection = ({ title, categoryId, products, onSeeAll }) => {
    // Filter from passed real products
    const sectionProducts = products.filter(p => p.category_id === categoryId).slice(0, 4);

    if (sectionProducts.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <Button variant="link" className="text-indigo-600 p-0 h-auto font-medium" onClick={onSeeAll}>
                    See All
                </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sectionProducts.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onContact={() => { }}
                        onShowMap={() => onSeeAll()}
                    />
                ))}
            </div>
        </div>
    );
};




import { useAuth } from '@/features/auth/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LogIn, UserPlus } from 'lucide-react';

// ... (existing imports remain, ensure no duplicates if adding new ones)

export default function Marketplace() {
    const navigate = useNavigate();
    const { isAuthenticated, navigateToLogin } = useAuth(); // Import auth context
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeSubCategory, setActiveSubCategory] = useState(null);
    const [products, setProducts] = useState([]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false); // State for login dialog
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');

    // Derived state: Home View is active if NO search, NO category, NO subcat
    const isHomeView = !searchTerm && !activeCategory && !activeSubCategory;

    useEffect(() => {
        const querySearch = searchParams.get('search');
        if (querySearch && querySearch !== searchTerm) {
            setSearchTerm(querySearch);
        }
    }, [searchParams]);

    useEffect(() => {
        loadProducts();
    }, [activeCategory, activeSubCategory, searchTerm, sort]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const items = await MarketplaceService.getItems({
                categoryId: activeCategory?.id,
                searchTerm
            });

            let finalProducts = (items && items.length > 0) ? items : MOCK_PRODUCTS;

            if (!items || items.length === 0) {
                if (activeCategory) {
                    finalProducts = finalProducts.filter(p => p.category_id === activeCategory.id);
                }
                if (activeSubCategory) {
                    finalProducts = finalProducts.filter(p => p.subcategory === activeSubCategory.id || p.category_id === activeSubCategory.id);
                }
                if (searchTerm) {
                    const lowerTerm = searchTerm.toLowerCase();
                    finalProducts = finalProducts.filter(p =>
                        p.title.toLowerCase().includes(lowerTerm) ||
                        p.description.toLowerCase().includes(lowerTerm)
                    );
                }
            }

            let sortedProducts = [...finalProducts];

            if (sort === 'price_asc') sortedProducts.sort((a, b) => a.price - b.price);
            if (sort === 'price_desc') sortedProducts.sort((a, b) => b.price - a.price);

            setProducts(sortedProducts);
        } catch (error) {
            console.error("Failed to load products", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (cat) => {
        if (activeCategory?.id === cat.id) {
            setActiveCategory(null);
            setActiveSubCategory(null);
        } else {
            setActiveCategory(cat);
            setActiveSubCategory(null);
        }
    };

    const handleSubCategorySelect = (sub, e) => {
        e.stopPropagation();
        setActiveSubCategory(activeSubCategory?.id === sub.id ? null : sub);
    };

    const clearFilters = () => {
        setActiveCategory(null);
        setActiveSubCategory(null);
        setSearchTerm('');
        setViewMode('grid');
    };

    // --- NEW: Handle Sell Click with Auth Check ---
    const handleSellClick = () => {
        if (!isAuthenticated) {
            setShowLoginDialog(true);
        } else {
            setIsCreateOpen(true);
        }
    };

    const CategoryMenu = () => (
        <div className="w-[300px] md:w-[600px] p-4 h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full overflow-y-auto pr-2">
                {MARKETPLACE_CATEGORIES.map(cat => (
                    <div key={cat.id} className="space-y-1">
                        <Button
                            variant="ghost"
                            className={`w-full justify-between font-medium text-base h-auto py-2 px-3 rounded-lg group ${activeCategory?.id === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            onClick={() => handleCategorySelect(cat)}
                        >
                            <span className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${activeCategory?.id === cat.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'} transition-colors`}>
                                    <cat.icon className="w-4 h-4" />
                                </div>
                                {cat.label}
                            </span>
                            {cat.subcategories?.length > 0 && (
                                <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${activeCategory?.id === cat.id ? 'rotate-90 text-indigo-400' : 'group-hover:text-slate-400'}`} />
                            )}
                        </Button>

                        {activeCategory?.id === cat.id && cat.subcategories?.length > 0 && (
                            <div className="pl-11 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                                {cat.subcategories.map(sub => (
                                    <Button
                                        key={sub.id}
                                        variant="ghost"
                                        size="sm"
                                        className={`w-full justify-start text-sm h-8 rounded-md ${activeSubCategory?.id === sub.id ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={(e) => handleSubCategorySelect(sub, e)}
                                    >
                                        {sub.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24">

                {/* Top Controls: Sell Button & Sort (Unified Row) */}
                <div className="flex justify-between items-center mb-4">
                    <div className="hidden md:block"></div>

                    <div className="flex items-center gap-3 ml-auto">
                        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-3 rounded-md transition-all ${viewMode === 'grid' || isHomeView ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-900'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <List className="w-4 h-4 mr-2" /> List
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-3 rounded-md transition-all ${viewMode === 'map' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-900'}`}
                                onClick={() => setViewMode('map')}
                            >
                                <MapIcon className="w-4 h-4 mr-2" /> Map
                            </Button>
                        </div>

                        <Button
                            onClick={handleSellClick} // Use new handler
                            size="sm"
                            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4 font-medium"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Sell Item
                        </Button>
                    </div>
                </div>

                {/* Main Search & Category Bar */}
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-4 max-w-4xl mx-auto flex items-center ring-offset-2 focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-11 px-4 text-slate-700 hover:bg-slate-50 rounded-xl mr-1 border-r border-transparent hover:border-slate-100 focus:bg-slate-50">
                                <LayoutGrid className="w-5 h-5 mr-2 text-slate-400" />
                                <span className="font-medium truncate max-w-[100px] md:max-w-[140px] text-left">
                                    {activeCategory ? activeCategory.label : 'Categories'}
                                </span>
                                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0 border-slate-100 shadow-xl rounded-xl bg-white w-[300px] md:w-[600px] ring-1 ring-slate-900/5 focus:outline-none" sideOffset={8}>
                            <CategoryMenu />
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-8 bg-slate-100 mx-2 hidden md:block"></div>

                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                            placeholder="Search cars, condos, furniture..."
                            className="h-11 pl-10 border-0 bg-transparent focus-visible:ring-0 placeholder:text-slate-400 text-base w-full shadow-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Expanded Filters Bar (Conditional) */}
                {activeCategory && viewMode !== 'map' && (
                    <div className="max-w-4xl mx-auto mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                        <FilterBar activeCategory={activeCategory} />
                    </div>
                )}

                {(activeCategory || activeSubCategory || searchTerm) && (
                    <div className="max-w-4xl mx-auto mb-6">
                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                            {activeCategory && (
                                <Badge variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100" onClick={() => setActiveCategory(null)}>
                                    {activeCategory.label} <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            {activeSubCategory && (
                                <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-slate-50 bg-white" onClick={() => setActiveSubCategory(null)}>
                                    {activeSubCategory.label} <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-slate-400 hover:text-red-500">Clear All</Button>
                        </div>
                    </div>
                )}

                {/* MAP VIEW */}
                {viewMode === 'map' ? (
                    <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                        <MapContainer center={[9.53, 100.04]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {products.map(product => (
                                product.lat && product.lng && (
                                    <Marker key={product.id} position={[product.lat, product.lng]}>
                                        <Popup>
                                            <div className="w-[160px]">
                                                <img src={product.images[0]?.url} className="w-full h-24 object-cover rounded-md mb-2" alt={product.title} />
                                                <p className="font-bold text-sm truncate">{product.title}</p>
                                                <p className="text-indigo-600 font-semibold text-xs">฿{product.price.toLocaleString()}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                        </MapContainer>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {isHomeView ? (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <CategorySection
                                    title="Fresh Real Estate"
                                    categoryId="real-estate"
                                    products={products}
                                    onSeeAll={() => setActiveCategory(MARKETPLACE_CATEGORIES.find(c => c.id === 'real-estate'))}
                                />
                                <CategorySection
                                    title="Latest Vehicles"
                                    categoryId="vehicles"
                                    products={products}
                                    onSeeAll={() => setActiveCategory(MARKETPLACE_CATEGORIES.find(c => c.id === 'vehicles'))}
                                />
                                <CategorySection
                                    title="Tech & Electronics"
                                    categoryId="electronics"
                                    products={products}
                                    onSeeAll={() => setActiveCategory(MARKETPLACE_CATEGORIES.find(c => c.id === 'electronics'))}
                                />
                                <CategorySection
                                    title="Home & Furniture"
                                    categoryId="furniture"
                                    products={products}
                                    onSeeAll={() => setActiveCategory(MARKETPLACE_CATEGORIES.find(c => c.id === 'furniture'))}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-center pb-2">
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                        {activeSubCategory ? activeSubCategory.label : activeCategory ? activeCategory.label : `Search: "${searchTerm}"`}
                                    </h2>

                                    <Select value={sort} onValueChange={setSort}>
                                        <SelectTrigger className="w-[150px] h-9 text-sm border-0 bg-transparent hover:bg-slate-50 transition-colors text-right">
                                            <span className="text-slate-500 mr-2">Sort:</span>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                        {[1, 2, 3, 4, 8].map(i => <div key={i} className="h-72 bg-slate-200 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                        {products.map(product => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onContact={() => { }}
                                                onShowMap={() => setViewMode('map')}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                                        <Box className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-900 font-semibold text-lg">No results found</p>
                                        <p className="text-slate-500 mb-6">Try adjusting your filters or search terms</p>
                                        <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateListingDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={loadProducts}
            />

            {/* LOGIN REQUIRED DIALOG */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sign in to Sell</DialogTitle>
                        <DialogDescription>
                            You need a Kosmoi account to post listings. This helps buyers contact you safely.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 py-4">
                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={navigateToLogin}>
                            <LogIn className="w-4 h-4 mr-2" />
                            Log In
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/login?signup=true')}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Sign Up
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowLoginDialog(false)} size="sm" className="w-full text-slate-500">
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
