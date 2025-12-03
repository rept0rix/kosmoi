import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return the Google Maps API key from environment (using gnew secret)
        const apiKey = Deno.env.get("gnew");
        
        if (!apiKey) {
            return Response.json({ error: 'API key not configured' }, { status: 500 });
        }

        return Response.json({ apiKey });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});