import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { latitude, longitude } = await req.json();
        
        if (!latitude || !longitude) {
            return Response.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        const apiKey = Deno.env.get("gnew");
        
        if (!apiKey) {
            return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
        }

        // Fetch English address
        const urlEn = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
        const responseEn = await fetch(urlEn);
        const dataEn = await responseEn.json();

        // Fetch Thai address
        const urlTh = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=th`;
        const responseTh = await fetch(urlTh);
        const dataTh = await responseTh.json();

        const extractAddress = (data) => {
            if (data.status === 'OK' && data.results && data.results.length > 0) {
                return data.results[0].formatted_address;
            }
            return null;
        };

        return Response.json({
            en: extractAddress(dataEn),
            th: extractAddress(dataTh)
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});