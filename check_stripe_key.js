
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.STRIPE_KEY || process.env.VITE_STRIPE_KEY || process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

if (key) {
    console.log("✅ Stripe Key found.");
    console.log("Key prefix:", key.substring(0, 7));
} else {
    console.log("❌ Stripe Key missing.");
    const allKeys = Object.keys(process.env);
    const stripeKeys = allKeys.filter(k => k.toLowerCase().includes('stripe') || k.toLowerCase().includes('stirpe'));
    console.log("Available keys (fuzzy match):", stripeKeys);

    // Check specifically for the user's mentioned key
    if (process.env.stirpe_s_key) {
        console.log("Found 'stirpe_s_key'!");
        console.log("Prefix:", process.env.stirpe_s_key.substring(0, 7));
    }
}
