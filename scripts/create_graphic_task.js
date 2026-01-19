
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createGraphicTask() {
    console.log("🎨 Creating Graphic Design Task...");

    const taskPayload = {
        title: "Generate Ad Visuals for Operation Roar",
        description: `
        **Objective**: Create 3 high-converting ad visuals for our Koh Samui marketing blitz.
        
        **Brand Style**: "Nano Banana" - Modern, Vibrant, Glassmorphism, Premium Island Vibes.
        
        **Requests**:
        1. **Taxi Ad**: A frustrated tourist looking at their phone at Samui Airport vs a happy tourist effectively using our app. Text overlay idea: "Stranded?"
           - Prompt suggestion: "Split screen, left side stressed tourist at tropical airport, right side happy tourist showing phone screen with modern taxi app UI, vibrant colors"
           
        2. **Massage Ad**: A luxurious in-villa massage scene. Professional, relaxing, high-end.
           - Prompt suggestion: "Luxury pool villa koh samui, thai massage therapist setting up spa bed, sunset view, soft lighting, premium atmosphere"
           
        3. **Repair Ad**: An urgent home repair situation (broken AC) being solved.
           - Prompt suggestion: "Modern tropical villa living room, air conditioner leaking water, digital hologram overlay showing 'Technician on the way', blue and white color scheme"

        **Action**:
        - Use the \`generate_image\` tool for each request.
        - Return the local file paths of the generated images in your final report.
        `,
        assigned_to: "graphic-designer", // Role ID
        status: "open",
        status: "pending",
        priority: "high"
    };

    const { data, error } = await supabase
        .from('agent_tasks') // Corrected table name based on error hint
        .insert([taskPayload])
        .select();

    if (error) {
        console.error("❌ Failed to create task:", error);
    } else {
        console.log("✅ Task created successfully! Task ID:", data[0].id);
    }
}

createGraphicTask();
