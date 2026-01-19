import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Store, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

export function ClaimBusinessFlow({ selectedPlace, onBack, onSuccess }) {
    const { user } = useAuth();
    const claimMutation = useMutation({
        mutationFn: async (/** @type {any} */ placeData) => {
            console.log("Claiming business for user:", user?.id);
            if (!user?.id) throw new Error("User authentication missing during claim");
            if (!placeData || !placeData.name) throw new Error("No place data provided");

            const googlePlaceId = placeData.placeId;

            // 1. Check if business exists by google_place_id
            const { data: existing, error: fetchError } = await db.from('service_providers')
                .select('*')
                .eq('google_place_id', googlePlaceId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existing) {
                console.log("Business found in DB:", existing);
                if (existing.owner_id === user.id) {
                    // Already owned by this user
                    return existing;
                }
                if (existing.owner_id) {
                    throw new Error("This business is already registered by another user.");
                }

                // Exists but no owner -> Claim it!
                const { data: updated, error: updateError } = await db.from('service_providers')
                    .update({
                        owner_id: user.id,
                        status: 'verified', // Auto-verify if they claim it via map (simplified for now)
                        claimed_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                return updated;
            }

            // 2. Create new business
            const payload = {
                business_name: placeData.name,
                description: `Imported from Google Maps: ${placeData.formatted_address || 'No address'}`,
                location: placeData.formatted_address || '',
                latitude: placeData.geometry?.location?.lat() || 0,
                longitude: placeData.geometry?.location?.lng() || 0,
                status: 'active', // Set active immediately for claimed businesses
                verified: true,
                phone: placeData.international_phone_number || '',
                category: 'other',
                google_place_id: googlePlaceId || '',
                metadata: {
                    google_rating: placeData.rating || 0,
                    google_photos: placeData.photos?.map(p => typeof p.getUrl === 'function' ? p.getUrl() : p) || []
                },
                owner_id: user?.id,
                claimed_at: new Date().toISOString()
            };

            return await db.entities.ServiceProvider.create(payload);
        },
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error("Claim failed:", error);
            alert("Failed to claim business. It might already be claimed.");
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
        >
            <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2 transition-all">
                <span className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span>Back to Search</span>
                </span>
            </Button>

            <Card>
                <CardContent className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-sm">
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedPlace.name}</h2>
                        <p className="text-slate-500 max-w-md mx-auto">{selectedPlace.formatted_address}</p>
                        {selectedPlace.international_phone_number && (
                            <p className="font-mono text-sm bg-slate-100 inline-block px-3 py-1 rounded-full">{selectedPlace.international_phone_number}</p>
                        )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm text-amber-900">
                        <p className="font-semibold mb-1">Claiming this business:</p>
                        <ul className="list-disc list-inside space-y-1 opacity-90">
                            <li>Verifies you as the owner</li>
                            <li>Imports photos and reviews from Google</li>
                            <li>Allows you to manage bookings and chats</li>
                        </ul>
                    </div>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 shadow-lg text-lg"
                        onClick={() => {
                            if (!user?.id) {
                                alert("Session expired or invalid. Please reload the page.");
                                return;
                            }
                            console.log("Starting claim mutation...");
                            claimMutation.mutate(selectedPlace);
                        }}
                        disabled={claimMutation.isPending}
                    >
                        <span className="flex items-center justify-center">
                            {claimMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Store className="w-5 h-5 mr-2" />
                            )}
                            <span>Confirm & Claim Business</span>
                        </span>
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
