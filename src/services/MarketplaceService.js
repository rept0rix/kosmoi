import { supabase } from '@/api/supabaseClient';

export const MarketplaceService = {
    // Categories
    getCategories: async () => {
        try {
            const { data, error } = await supabase
                .from('marketplace_categories')
                .select('*')
                .order('name');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("No categories found");
            return data;
        } catch (error) {
            console.warn("Using fallback categories due to DB error:", error);
            // Fallback categories if DB is not ready
            return [
                { id: '1', name: 'Vehicles', slug: 'vehicles', icon: 'Car' },
                { id: '2', name: 'Electronics', slug: 'electronics', icon: 'Smartphone' },
                { id: '3', name: 'Furniture', slug: 'furniture', icon: 'Sofa' },
                { id: '4', name: 'Property (Rent/Sale)', slug: 'property', icon: 'Home' },
                { id: '5', name: 'Fashion', slug: 'fashion', icon: 'Shirt' },
                { id: '6', name: 'Hobbies & Sports', slug: 'hobbies', icon: 'Activity' },
                { id: '7', name: 'Services', slug: 'services', icon: 'Briefcase' },
                { id: '8', name: 'Others', slug: 'others', icon: 'Box' }
            ];
        }
    },


    // Items
    getItems: async ({ categoryId = null, searchTerm = '', sellerId = null, limit = 50 } = {}) => {
        try {
            let query = supabase
                .from('marketplace_listings')
                .select('*, seller:seller_id(raw_user_meta_data)') // seller_id is FK to auth.users, can't easily join auth.users from client without special view.
                // However, RLS policy allows public select.
                // We might fail to get 'seller' user metadata if not public.
                // Simplify: just get the listings first.
                .order('created_at', { ascending: false })
                .limit(limit);

            // If filtering by specific seller, show all their items (active/sold/etc)
            if (sellerId) {
                query = query.eq('seller_id', sellerId);
            } else {
                // Otherwise only show active items to public
                query = query.eq('status', 'active');
            }

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Failed to fetch items:", error);
            return [];
        }
    },

    getItemById: async (id) => {
        const { data, error } = await supabase
            .from('marketplace_listings')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    createItem: async (itemData, images = []) => {
        try {
            // 1. Upload Images First
            let uploadedImageUrls = [];
            
            if (images.length > 0) {
                const imagePromises = images.map(async (file) => {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `marketplace/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('public-images')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('public-images')
                        .getPublicUrl(filePath);

                    return { url: publicUrl };
                });
                uploadedImageUrls = await Promise.all(imagePromises);
            }

            // 2. Insert Listing
            const { data: item, error: itemError } = await supabase
                .from('marketplace_listings')
                .insert({
                    seller_id: (await supabase.auth.getUser()).data.user.id,
                    ...itemData,
                    images: uploadedImageUrls,
                    status: 'active'
                })
                .select()
                .single();

            if (itemError) throw itemError;
            return item;
        } catch (error) {
            console.error("Create Item Failed:", error);
            throw error;
        }
    },

    deleteItem: async (id) => {
        const { error } = await supabase
            .from('marketplace_listings')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
