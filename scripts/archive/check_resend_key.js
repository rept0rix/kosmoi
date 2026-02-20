
import dotenv from 'dotenv';
dotenv.config();

if (process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY) {
    console.log("✅ RESEND_API_KEY found.");
} else {
    console.log("❌ RESEND_API_KEY missing (checked VITE_ prefix too).");
}
