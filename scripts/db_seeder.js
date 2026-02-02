
import { createClient } from '@supabase/supabase-js';

export const MOCK_PROVIDERS = [
    {
        business_name: "Samui Plumbers Pro",
        category: "plumber",
        description: "Professional plumbing services for homes and villas. We specialize in leak detection, pipe repair, and bathroom installations. Available 24/7 for emergencies.",
        phone: "081-234-5678",
        location: "Bo Phut, Koh Samui",
        latitude: 9.5532,
        longitude: 100.0321,
        images: [
            "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
    },
    {
        business_name: "Cool Breeze AC Repair",
        category: "ac_repair",
        description: "Keep your villa cool with our expert AC cleaning and repair services. We service all major brands including Daikin, Mitsubishi, and Samsung.",
        phone: "089-876-5432",
        location: "Chaweng, Koh Samui",
        latitude: 9.5318,
        longitude: 100.0614,
        images: [
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1581094794329-cd1096d7a43f?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
    },
    {
        business_name: "Island Taxi Service",
        category: "taxi",
        description: "Reliable taxi and transfer service around Koh Samui. Airport transfers, full day tours, and late night pickups.",
        phone: "099-111-2222",
        location: "Lamai, Koh Samui",
        latitude: 9.4593,
        longitude: 100.0478,
        images: [
            "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
    },
    {
        business_name: "Samui Clean Team",
        category: "cleaning",
        description: "Top-rated cleaning service for villas, apartments, and offices. We use eco-friendly products and guarantee satisfaction.",
        phone: "088-555-4444",
        location: "Maenam, Koh Samui",
        latitude: 9.5694,
        longitude: 99.9976,
        images: [
            "https://images.unsplash.com/photo-1581578731117-104f8a746a32?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1527515637-62c990262bfa?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: false,
        status: 'active',
    },
    {
        business_name: "Master Electrician",
        category: "electrician",
        description: "Certified electrician for all your electrical needs. Wiring, lighting installation, safety checks, and repairs.",
        phone: "082-333-9999",
        location: "Bangrak, Koh Samui",
        latitude: 9.5587,
        longitude: 100.0545,
        images: [
            "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
    }
];

export const MOCK_EXPERIENCES = [
    {
        title: "The Samui Sovereign",
        description: "A 70ft luxury motor yacht offering unparalleled stability and space. Perfect for large groups and exclusive family gatherings. Featuring a private chef and premium flybridge.",
        price: 65000,
        duration: "4 Hours",
        category: "nature",
        image_url: "https://images.unsplash.com/photo-1544433330-9485b3bb947b?auto=format&fit=crop&q=80&w=2000",
        rating: 5.0,
        reviews_count: 12
    },
    {
        title: "Ocean Whisper Catamaran",
        description: "Sleek and modern catamaran designed for smooth sailing. Features an expansive sun deck and premium surround sound for a club-like atmosphere at sea.",
        price: 32000,
        duration: "4 Hours",
        category: "nature",
        image_url: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=2000",
        rating: 4.8,
        reviews_count: 8
    }
];

export const MOCK_PROPERTIES = [
    {
        title: "The Sky Villa",
        description: "Escape to Koh Samui's most exclusive hilltops. Fully staffed estate with private chef, infinity pool, and absolute privacy.",
        price: 45000,
        location: "Chaweng Noi",
        type: "rent",
        status: "active",
        images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2671&auto=format&fit=crop"]
    },
    {
        title: "Modern Minimalist Sale",
        description: "Brand new modern villa with stunning ocean views. Completion scheduled for Q4 2025.",
        price: 24500000,
        location: "Plai Laem",
        type: "sale",
        status: "active",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"]
    },
    {
        title: "Oceanfront Estate",
        description: "Modern masterpiece right on the water. Featuring floor-to-ceiling windows and direct beach access.",
        price: 85000,
        location: "Bophut",
        type: "rent",
        status: "active",
        images: ["https://images.unsplash.com/photo-1600596542815-22b4899975d6?q=80&w=2675&auto=format&fit=crop"]
    }
];

export async function clearDatabase(supabase) {
    console.log('--- CLEARING DATABASE ---');
    console.log('⚠️  Note: Skipping service_providers due to complex foreign key dependencies.');
    console.log('    Only clearing properties and experiences for now.\n');

    // Simple approach: Only clear properties and experiences (Real Estate data)
    // Avoiding service_providers due to extensive foreign key constraints from:
    // - business_analytics, business_settings, business_claims
    // - board_meetings, bookings, leads, crm_leads, reviews, favorites
    const tables = [
        'property_images',
        'properties',
        'experiences'
    ];

    for (const table of tables) {
        console.log(`Clearing table: ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            if (error.code === '42P01') {
                console.log(`   ℹ️  Table ${table} does not exist, skipping...`);
            } else {
                console.error(`   ❌ Error clearing ${table}:`, error.message);
                throw error;
            }
        } else {
            console.log(`   ✅ Cleared ${table}`);
        }
    }
    console.log('✅ Real Estate tables cleared.');
}

export async function seedDatabase(supabase, agentId = '00000000-0000-0000-0000-000000000000') {
    console.log('--- SEEDING DATABASE ---');
    console.log('⚠️  Note: Skipping service_providers seeding (use separate flow if needed).\n');

    // Skip providers due to complexity - just seed Real Estate data
    // 1. Seed Experiences
    console.log('Seeding experiences...');
    for (const exp of MOCK_EXPERIENCES) {
        const { error } = await supabase.from('experiences').insert(exp);
        if (error) throw error;
        console.log(`✅ Seeded Experience: ${exp.title}`);
    }

    // 2. Seed Properties
    console.log('Seeding properties...');
    for (const prop of MOCK_PROPERTIES) {
        const { images, ...propData } = prop;
        const { data, error } = await supabase.from('properties').insert({
            ...propData,
            agent_id: agentId
        }).select().single();

        if (error) throw error;

        if (images && images.length > 0) {
            const imageRows = images.map(url => ({ property_id: data.id, url }));
            await supabase.from('property_images').insert(imageRows);
        }
        console.log(`✅ Seeded Property: ${data.title}`);
    }

    console.log('🏁 Seeding finished (Real Estate data only).');
}
