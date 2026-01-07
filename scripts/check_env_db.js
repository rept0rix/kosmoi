import dotenv from 'dotenv';
dotenv.config();

if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL is found.");
} else {
    console.log("DATABASE_URL is MISSING.");
}
