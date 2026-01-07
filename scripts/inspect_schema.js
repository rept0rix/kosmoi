import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function inspect() {
    console.log("Inspecting:", supabaseUrl);

    // The root of the REST API returns the Swagger/OpenAPI spec
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch schema:", response.status, response.statusText);
        return;
    }

    const json = await response.json();

    // Check service_providers definition
    const definitions = json.definitions;
    if (definitions && definitions.service_providers) {
        console.log("✅ Table 'service_providers' found.");
        const properties = definitions.service_providers.properties;
        console.log("Columns:", Object.keys(properties).join(", "));

        if (properties.owner_id) {
            console.log("🎉 'owner_id' column EXISTS in Schema!");
        } else {
            console.log("❌ 'owner_id' column is MISSING from Schema.");
        }
    } else {
        console.error("❌ Table 'service_providers' NOT found in schema definition.");
    }
}

inspect();
