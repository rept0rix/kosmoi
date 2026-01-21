
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

const SAMPLE_ITEMS = [
    // --- VEHICLES ---
    {
        title: "Honda Click 160cc (2023) - Black",
        price: 55000,
        category_id: "vehicles",
        subcategory: "motorbikes",
        location_name: "Chaweng",
        description: "Perfect condition, 5000km only. One owner. Green book ready to transfer.",
        images: [{ url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80" }]
    },
    {
        title: "Yamaha NMAX 155 - Grey",
        price: 68000,
        category_id: "vehicles",
        subcategory: "motorbikes",
        location_name: "Lamai",
        description: "Great bike for island roads. ABS version. Tax paid until 2025.",
        images: [{ url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80" }]
    },
    {
        title: "Honda PCX 160 (Rent/Sale)",
        price: 72000,
        category_id: "vehicles",
        subcategory: "motorbikes",
        location_name: "Maenam",
        description: "Keyless entry. 2022 Model. Selling because leaving island.",
        images: [{ url: "https://images.unsplash.com/photo-1622185135505-2d795043906a?w=800&q=80" }]
    },
    {
        title: "Toyota Vios 2018 - Auto",
        price: 320000,
        category_id: "vehicles",
        subcategory: "cars",
        location_name: "Bophut",
        description: "Reliable car, cold AC. 85k km. Service history at Toyota Samui.",
        images: [{ url: "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80" }]
    },
    {
        title: "Suzuki Swift GLX 2020",
        price: 390000,
        category_id: "vehicles",
        subcategory: "cars",
        location_name: "Chaweng Noi",
        description: "Sporty compact car. pristine condition inside out.",
        images: [{ url: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&q=80" }]
    },

    // --- REAL ESTATE ---
    {
        title: "Luxury 3-Bed Pool Villa",
        price: 120000,
        category_id: "real-estate",
        subcategory: "rent",
        location_name: "Chaweng Noi",
        description: "Sea view villa for monthly rent. Infinity pool, full kitchen, 3 bedrooms ensuite.",
        images: [{ url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80" }]
    },
    {
        title: "Modern 1-Bed Condo Replay",
        price: 15000,
        category_id: "real-estate",
        subcategory: "rent",
        location_name: "Bophut",
        description: "Long term contract. Gym, Pool, Tennis court access included. 5 mins to Fisherman Village.",
        images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80" }]
    },
    {
        title: "Cozy Bungalow near Beach",
        price: 25000,
        category_id: "real-estate",
        subcategory: "rent",
        location_name: "Lamai",
        description: "Quiet area, 500m to beach. Garden view. WiFi included.",
        images: [{ url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80" }]
    },
    {
        title: "Land Plot Seaview 1 Rai",
        price: 4500000,
        category_id: "real-estate",
        subcategory: "sale",
        location_name: "Bang Por",
        description: "Chanote title. Ready to build. Concrete road access.",
        images: [{ url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80" }]
    },
    {
        title: "Studio Apartment Central Festival",
        price: 12000,
        category_id: "real-estate",
        subcategory: "rent",
        location_name: "Chaweng",
        description: "Convenient location. Fully furnished. Available immediately.",
        images: [{ url: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80" }]
    },

    // --- ELECTRONICS ---
    {
        title: "iPhone 14 Pro Max 256GB Deep Purple",
        price: 28900,
        category_id: "electronics",
        subcategory: "phones",
        location_name: "Chaweng",
        description: "Battery 92%. Box and cable included. No scratches.",
        images: [{ url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80" }]
    },
    {
        title: "MacBook Air M1 Space Grey",
        price: 21000,
        category_id: "electronics",
        subcategory: "computers",
        location_name: "Maenam",
        description: "Perfect working condition. Small dent on corner (see photo). English/Thai keyboard.",
        images: [{ url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80" }]
    },
    {
        title: "JBL PartyBox 310",
        price: 13500,
        category_id: "electronics",
        subcategory: "audio",
        location_name: "Lamai",
        description: "Beast of a speaker. Used for 2 parties only. Mic included.",
        images: [{ url: "https://images.unsplash.com/photo-1543536448-d209d2d12a1d?w=800&q=80" }]
    },
    {
        title: "PlayStation 5 Disc Edition",
        price: 14000,
        category_id: "electronics",
        subcategory: "gaming",
        location_name: "Bophut",
        description: "Includes 2 controllers and FIFA 24.",
        images: [{ url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80" }]
    },
    {
        title: "Samsung 55\" 4K Smart TV",
        price: 8900,
        category_id: "electronics",
        subcategory: "tv",
        location_name: "Chaweng",
        description: "Moving sale. Must pick up.",
        images: [{ url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80" }]
    },

    // --- FURNITURE ---
    {
        title: "IKEA Friheten Sofa Bed",
        price: 6500,
        category_id: "furniture",
        subcategory: "living-room",
        location_name: "Maenam",
        description: "Dark grey. Converts to double bed. Storage inside.",
        images: [{ url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80" }]
    },
    {
        title: "Teak Wood Dining Table + 6 Chairs",
        price: 18000,
        category_id: "furniture",
        subcategory: "dining",
        location_name: "Bang Rak",
        description: "Solid wood. Very heavy. Needs truck for transport.",
        images: [{ url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80" }]
    },
    {
        title: "King Size Bed Frame + Mattress",
        price: 8000,
        category_id: "furniture",
        subcategory: "bedroom",
        location_name: "Chaweng Noi",
        description: "Comfortable pocket spring mattress. Clean.",
        images: [{ url: "https://images.unsplash.com/photo-1505693436371-52de08e3314a?w=800&q=80" }]
    },
    {
        title: "Office Chair Ergonomic",
        price: 2500,
        category_id: "furniture",
        subcategory: "office",
        location_name: "Bophut",
        description: "Mesh back. Adjustable height and armrests.",
        images: [{ url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80" }]
    },
    {
        title: "Outdoor Rattan Set",
        price: 4500,
        category_id: "furniture",
        subcategory: "outdoor",
        location_name: "Lamai",
        description: "Table and 2 chairs. Weather resistant. Good for balcony.",
        images: [{ url: "https://images.unsplash.com/photo-1593414220183-fd25d3df393e?w=800&q=80" }]
    },

    // --- SERVICES / MISC ---
    {
        title: "Visa Run Service to Malaysia",
        price: 4500,
        category_id: "services",
        subcategory: "travel",
        location_name: "Nathon",
        description: "Includes van and ferry. Professional stamp service.",
        images: [{ url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80" }]
    },
    {
        title: "Private Thai Lessons",
        price: 400,
        category_id: "services",
        subcategory: "education",
        location_name: "Online/Cafe",
        description: "Learn to speak Thai with experienced teacher. 400 THB per hour.",
        images: [{ url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80" }]
    },
    {
        title: "Cleaner / Housekeeper Available",
        price: 600,
        category_id: "services",
        subcategory: "home",
        location_name: "Any",
        description: "Daily cleaning. 600 THB for 3 hours. Honest and reliable.",
        images: [{ url: "https://images.unsplash.com/photo-1581578731117-104f2a417954?w=800&q=80" }]
    },
    {
        title: "Surfboard for Sale",
        price: 5000,
        category_id: "sports",
        subcategory: "water",
        location_name: "Chaweng",
        description: "7ft Soft top. Good for beginners.",
        images: [{ url: "https://images.unsplash.com/photo-1531722569936-825d1dd91b19?w=800&q=80" }]
    },
    {
        title: "Gym Membership Transfer (3 months)",
        price: 3000,
        category_id: "sports",
        subcategory: "fitness",
        location_name: "Chaweng",
        description: "Moving off island. Elite Gym membership valid until April.",
        images: [{ url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" }]
    },
];

async function seedMarketplace() {
    console.log("🌱 Starting Marketplace Seeding...");


    // 1. Get a Host User (Hardcoded for stability)
    const sellerId = "2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e";


    console.log(`👤 Assigning items to Seller ID: ${sellerId}`);

    // 2. Insert Items
    const itemsToInsert = SAMPLE_ITEMS.map(item => ({
        ...item,
        seller_id: sellerId,
        status: 'active',
        view_count: Math.floor(Math.random() * 100),
        contact_info: { phone: "0812345678", line: "samui_seller" },
        // Random drift for location around Samui center (9.512, 100.052)
        latitude: 9.512 + (Math.random() * 0.1 - 0.05),
        longitude: 100.052 + (Math.random() * 0.1 - 0.05),
    }));

    const { data, error } = await supabase
        .from('marketplace_listings')
        .insert(itemsToInsert)
        .select();

    if (error) {
        console.error("❌ Seeding Failed:", error);
    } else {
        console.log(`✅ Successfully added ${data.length} items to Marketplace!`);
    }
}

seedMarketplace();
