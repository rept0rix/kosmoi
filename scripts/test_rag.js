
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Using anon key as we set verify_jwt=false (public) or we can use anon key if verify_jwt=true but public
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const SEARCH_URL = `${supabaseUrl}/functions/v1/search-knowledge`;

async function testSearch() {
    const query = "What is the best beach for parties?";
    console.log(`🔍 Querying: "${query}"`);

    try {
        const res = await fetch(SEARCH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({ query })
        });

        if (!res.ok) {
            console.error("❌ Search Failed:", res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log("✅ Results:");
        if (data.documents) {
            data.documents.forEach((doc, i) => {
                console.log(`\n--- Result ${i + 1} (Similarity: ${doc.similarity.toFixed(2)}) ---`);
                console.log(doc.content);
            });
        } else {
            console.log("No documents returned.", data);
        }

    } catch (e) {
        console.error("Network Error:", e);
    }
}

testSearch();
