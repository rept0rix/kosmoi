import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("🚀 Starting Yacht Data Migration...");

    // 1. Create table and policies (via RPC if available, otherwise we assume table exists or use client)
    // For this environment, we'll try to insert data directly assuming the table was created by the previous tool try or we create it here via a hacky RPC if allowed.
    // If RPC isn't available, we'll try to just insert.

    const listings = [
        {
            name: 'The Samui Sovereign',
            description: 'A 70ft luxury motor yacht offering unparalleled stability and space. Perfect for large groups and exclusive family gatherings. Includes a walk-around deck and premium flybridge.',
            price_thb: 65000,
            duration_hours: 4,
            max_guests: 25,
            features: ["Private Chef", "Champagne Greeting", "Snorkeling Gear", "Jet Ski Access"],
            category: 'Ultra Luxury'
        },
        {
            name: 'Ocean Whisper Catamaran',
            description: 'Sleek and modern catamaran designed for smooth sailing. Features an expansive sun deck and premium surround sound for a club-like atmosphere at sea.',
            price_thb: 32000,
            duration_hours: 4,
            max_guests: 12,
            features: ["Open Bar", "Mediterranean Platter", "SUP Boards", "Sunset Deck"],
            category: 'Premium'
        },
        {
            name: 'Blue Horizon Sailing',
            description: 'Authentic sailing experience for those who love the wind. Traditional monohull with modern cabin luxuries, providing an intimate connection with the ocean.',
            price_thb: 22500,
            duration_hours: 6,
            max_guests: 8,
            features: ["Traditional Thai Meal", "Fishing Equipment", "Dinghy Access", "Local Guide"],
            category: 'Classic'
        }
    ];

    try {
        // Try to create table first via some trick or just expect it
        console.log("Creating/Populating table...");

        // We'll use the service role to upsert based on name
        for (const yacht of listings) {
            const { error } = await supabase
                .from('yacht_listings')
                .upsert(yacht, { onConflict: 'name' });

            if (error) {
                console.error(`❌ Error migrating ${yacht.name}:`, error.message);
                if (error.message.includes('not found')) {
                    console.log("Table doesn't exist. Please run the SQL in Supabase Dashboard first or use an RPC.");
                }
            } else {
                console.log(`✅ Migrated: ${yacht.name}`);
            }
        }

    } catch (err) {
        console.error("Migration Failed:", err);
    }

    process.exit(0);
}

migrate();
