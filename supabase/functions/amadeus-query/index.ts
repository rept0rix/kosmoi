// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAmadeusToken(clientId: string, clientSecret: string) {
    console.log("Fetching Amadeus Token...");
    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to get Amadeus token: ${err}`);
    }

    const data = await response.json();
    return data.access_token;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const AMADEUS_CLIENT_ID = Deno.env.get('AMADEUS_CLIENT_ID');
        const AMADEUS_CLIENT_SECRET = Deno.env.get('AMADEUS_CLIENT_SECRET');

        if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
            throw new Error('Missing AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET');
        }

        const { action, params = {} } = await req.json();
        const token = await getAmadeusToken(AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET);

        let url = "";

        switch (action) {
            case 'search-hotels': {
                const { cityCode = 'USM' } = params;
                url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`;
                break;
            }
            case 'hotel-offers': {
                const { hotelIds, adults = 1, checkInDate, checkOutDate } = params;
                url = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds}&adults=${adults}`;
                if (checkInDate) url += `&checkInDate=${checkInDate}`;
                if (checkOutDate) url += `&checkOutDate=${checkOutDate}`;
                break;
            }
            case 'hotel-details': {
                const { hotelId } = params;
                // Note: Get Hotel Details is often part of reference data or separate API
                url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-hotels?hotelIds=${hotelId}`;
                break;
            }
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        console.log(`Calling Amadeus API: ${url}`);
        const amadeusResponse = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await amadeusResponse.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Amadeus Edge Function Error:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
