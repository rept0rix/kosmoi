import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL')

console.log(`Automation Proxy Initialized. Target: ${N8N_WEBHOOK_URL ? 'Configured' : 'Missing'}`);

serve(async (req: Request) => {
    try {
        // 1. Parse Input
        const { event, data } = await req.json()
        console.log(`[Automation Proxy] Received Event: ${event}`, data?.id)

        // 2. Validate Config
        if (!N8N_WEBHOOK_URL) {
            console.warn("⚠️  Missing N8N_WEBHOOK_URL - Automation Skipped")
            return new Response(JSON.stringify({
                status: 'skipped',
                reason: 'N8N_WEBHOOK_URL env var not set'
            }), {
                headers: { "Content-Type": "application/json" },
                status: 200
            })
        }

        // 3. Forward to n8n (Reliable Delivery)
        const payload = {
            event_type: event,
            payload: data,
            timestamp: new Date().toISOString(),
            source: 'samui-service-hub'
        };

        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error(`❌ n8n Error (${n8nResponse.status}): ${errorText}`)
            return new Response(JSON.stringify({
                status: 'error',
                message: 'n8n rejected payload',
                details: errorText
            }), {
                status: 502,
                headers: { "Content-Type": "application/json" }
            })
        }

        console.log(`✅ Event forwarded to n8n successfully`)
        return new Response(
            JSON.stringify({ status: 'success', n8n_status: n8nResponse.status }),
            { headers: { "Content-Type": "application/json" }, status: 200 },
        )

    } catch (error: any) {
        console.error(`💥 Proxy Exception:`, error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
})
