import { db } from './src/api/supabaseClient.js';

console.log("Checking db.from...");
try {
    if (typeof db.from === 'function') {
        console.log("db.from exists!");
    } else {
        console.error("db.from is missing!");
        process.exit(1);
    }
} catch (e) {
    console.error("Error checking db.from:", e);
    process.exit(1);
}
