import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: any) => {
    try {
        const { latitude, longitude } = await req.json();
        
        if (!latitude || !longitude) {
            return Response.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        // Round to 4 decimal places (~11m precision) to increase cache hit rate
        const lat = Number(parseFloat(latitude).toFixed(4));
        const lng = Number(parseFloat(longitude).toFixed(4));

        // Initialize Supabase Client (Service Role for cache access)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Check Cache
        const { data: cached } = await supabase
            .from('geo_cache')
            .select('address_en, address_th')
            .eq('latitude', lat)
            .eq('longitude', lng)
            .maybeSingle();

        if (cached) {
            console.log(`✅ Cache Hit for ${lat}, ${lng}`);
            return Response.json({
                en: cached.address_en,
                th: cached.address_th
            });
        }

        console.log(`⚠️ Cache Miss for ${lat}, ${lng}. Fetching from Google...`);

        const apiKey = Deno.env.get("gnew");
        if (!apiKey) {
            return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
        }

        // 2. Fetch from Google (English)
        const urlEn = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
        const resEn = await fetch(urlEn);
        const dataEn = await resEn.json();
        const addressEn = dataEn.status === 'OK' && dataEn.results.length > 0 ? dataEn.results[0].formatted_address : null;

        // 3. Fetch from Google (Thai)
        const urlTh = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=th`;
        const resTh = await fetch(urlTh);
        const dataTh = await resTh.json();
        const addressTh = dataTh.status === 'OK' && dataTh.results.length > 0 ? dataTh.results[0].formatted_address : null;

        // 4. Save to Cache (Fire and forget, or await)
        if (addressEn || addressTh) {
            // Use upsert to handle race conditions safely
            await supabase.from('geo_cache').upsert({
                latitude: lat,
                longitude: lng,
                address_en: addressEn,
                address_th: addressTh
            }, { onConflict: 'latitude, longitude' });
        }

        return Response.json({
            en: addressEn,
            th: addressTh
        });
    } catch (error: any) {
        console.error("Geocode Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});