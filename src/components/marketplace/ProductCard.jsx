import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, Bed, Bath, Maximize, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProductCard({ product, onContact, onShowMap }) {
    const navigate = useNavigate();
    const isRealEstate = product.category_id === 'real-estate';

    const formatPrice = (price) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleCardClick = () => {
        navigate(`/marketplace/${product.id}`);
    };

    return (
        <Card
            className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full flex flex-col cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                    {product.status !== 'active' && (
                        <Badge variant="destructive" className="uppercase">
                            {product.status}
                        </Badge>
                    )}
                    {/* Real Estate Specific Badges */}
                    {isRealEstate && product.subcategory && (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 uppercase text-xs font-bold shadow-sm">
                            For {product.subcategory === 'sale' ? 'Sale' : 'Rent'}
                        </Badge>
                    )}
                </div>

                {/* Show on Map Button (Overlay) */}
                <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-slate-700 shadow-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowMap && onShowMap(product);
                    }}
                >
                    <MapPin className="w-3 h-3 mr-1" /> Map
                </Button>
            </div>

            <CardContent className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[1.5rem] text-base group-hover:text-indigo-600 transition-colors">
                        {product.title}
                    </h3>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    <span className="truncate">{product.location || 'Koh Samui'}</span>
                </div>

                {/* Real Estate Specific Features Row */}
                {isRealEstate ? (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-slate-600">
                        {/* Mock data fallbacks for demo */}
                        <div className="flex items-center gap-1.5" title="Bedrooms">
                            <Bed className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">{product.bedrooms || 2}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Bathrooms">
                            <Bath className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">{product.bathrooms || 2}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Size">
                            <Maximize className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium">{product.size_sqm || 110} m²</span>
                        </div>
                    </div>
                ) : (
                    // Standard Product Price in Content for non-RE
                    <p className="font-bold text-indigo-600 text-lg">
                        {formatPrice(product.price)}
                    </p>
                )}
            </CardContent>

            <CardFooter className="p-3 bg-gray-50/50 border-t flex justify-between items-center gap-2">
                {/* Real Estate Price is prominent in Footer */}
                {isRealEstate ? (
                    <p className="font-bold text-indigo-700 text-lg">
                        {formatPrice(product.price)}
                    </p>
                ) : (
                    <div /> // Spacer
                )}

                <Button
                    size={isRealEstate ? 'sm' : 'default'}
                    variant="outline"
                    className={`text-indigo-600 border-indigo-200 hover:bg-indigo-50 ${!isRealEstate ? 'w-full' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onContact && onContact(product);
                    }}
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {isRealEstate ? 'Contact' : 'Contact Seller'}
                </Button>
            </CardFooter>
        </Card>
    );
}
