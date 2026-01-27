import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load .env manually since we are in a script
const envConfig = dotenv.parse(fs.readFileSync(".env"));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error("Missing keys in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const KNOWLEDGE_ITEMS = [
  {
    category: "General",
    content:
      "Kosmoi is the premier service hub for Koh Samui, Thailand. It connects locals, tourists, and expats with trusted service providers, real estate listings, and a marketplace for goods.",
  },
  {
    category: "Marketplace",
    content:
      "The Kosmoi Marketplace offers a wide range of items including vehicles (cars, motorbikes), real estate (condos, villas), furniture, and electronics. Users can list items for sale or contact sellers directly.",
  },
  {
    category: "Services",
    content:
      "Kosmoi provides access to various service providers including cleaners, pool maintenance, electricians, plumbers, and private chefs. All providers are verified.",
  },
  {
    category: "Real Estate",
    content:
      "Find your dream home in Koh Samui with Kosmoi Real Estate. Listings include sea-view villas, beachfront condos, and land plots for sale or rent in Chaweng, Lamai, Bophut, and Maenam.",
  },
  {
    category: "Experiences",
    content:
      "Discover unique experiences in Koh Samui. From private boat tours to cooking classes and wellness retreats, Kosmoi helps you book memorable activities.",
  },
  {
    category: "Transport",
    content:
      "Kosmoi offers transport solutions including taxi booking, car rentals, and motorbike rentals to help you get around the island.",
  },
];

async function seed() {
  console.log("🌱 Seeding Knowledge Base...");

  for (const item of KNOWLEDGE_ITEMS) {
    try {
      console.log(`Embedding: ${item.category}...`);
      const result = await model.embedContent(item.content);
      const embedding = result.embedding.values;

      const { error } = await supabase.from("knowledge_base").insert({
        content: item.content,
        category: item.category,
        embedding: embedding,
        metadata: { source: "seed_script" },
      });

      if (error) {
        console.error(`Error inserting ${item.category}:`, error.message);
      } else {
        console.log(`✅ Inserted: ${item.category}`);
      }
    } catch (e) {
      console.error(`Failed to process ${item.category}:`, e);
    }
  }
  console.log("✨ Seeding Complete!");
}

seed();
