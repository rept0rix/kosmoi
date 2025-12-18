
import dotenv from 'dotenv';
dotenv.config();

console.log("Checking Environment Variables...");
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "Exists" : "Missing");
console.log("VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY ? "Exists" : "Missing");
console.log("Current Directory:", process.cwd());
