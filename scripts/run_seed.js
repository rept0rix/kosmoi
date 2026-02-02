import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { seedDatabase, clearDatabase } from './db_seeder.js';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🌱 Direct Seeding Script Started...\n');

async function main() {
    try {
        console.log('1️⃣ Clearing existing data...');
        await clearDatabase(supabase);

        console.log('\n2️⃣ Seeding database...');
        await seedDatabase(supabase, '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e');

        console.log('\n✅ Seeding completed successfully!');
        console.log('🔍 Check your database or visit /real-estate to see the data.');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error(error);
    }
}

main();
