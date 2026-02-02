import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

const MOCK_PROVIDERS = [
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
        status: 'active'
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
        status: 'active'
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
        status: 'active'
    }
];

const MOCK_EXPERIENCES = [
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

const MOCK_PROPERTIES = [
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
        title: "Oceanfront Estate",
        description: "Modern masterpiece right on the water. Featuring floor-to-ceiling windows and direct beach access.",
        price: 85000,
        location: "Bophut",
        type: "rent",
        status: "active",
        images: ["https://images.unsplash.com/photo-1600596542815-22b4899975d6?q=80&w=2675&auto=format&fit=crop"]
    }
];

async function seed() {
    console.log('🚀 Starting Seeding...');

    // 1. Clear Data
    console.log('🧹 Clearing data...');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('favorites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('service_providers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('property_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('experiences').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Seed Providers
    console.log('🏢 Seeding Service Providers...');
    for (const p of MOCK_PROVIDERS) {
        const { data, error } = await supabase.from('service_providers').insert(p).select().single();
        if (error) console.error(`Error seeding ${p.business_name}:`, error.message);
        else console.log(`✅ Seeded: ${data.business_name}`);
    }

    // 3. Seed Experiences
    console.log('🚤 Seeding Experiences...');
    for (const e of MOCK_EXPERIENCES) {
        const { data, error } = await supabase.from('experiences').insert(e).select().single();
        if (error) console.error(`Error seeding ${e.title}:`, error.message);
        else console.log(`✅ Seeded: ${data.title}`);
    }

    // 4. Seed Properties
    console.log('🏡 Seeding Properties...');
    // Get a user ID for agent_id
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const agentId = users?.[0]?.id || '00000000-0000-0000-0000-000000000000';

    for (const p of MOCK_PROPERTIES) {
        const { images, ...propData } = p;
        const { data, error } = await supabase.from('properties').insert({ ...propData, agent_id: agentId }).select().single();
        if (error) {
            console.error(`Error seeding ${p.title}:`, error.message);
            continue;
        }
        console.log(`✅ Seeded: ${data.title}`);

        if (images) {
            const imgRows = images.map(url => ({ property_id: data.id, url }));
            await supabase.from('property_images').insert(imgRows);
        }
    }

    console.log('🎉 Seeding Complete!');
}

seed().catch(err => {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
});
