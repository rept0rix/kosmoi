// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// --- Configuration ---
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// TEST_EMAIL: set this env var in Supabase Dashboard only during development/testing.
// In production, leave it unset — emails will go to the actual business email.
// If unset AND business has no email, the brain logs a 'lead.no_email' signal.
const TEST_EMAIL = Deno.env.get('TEST_EMAIL') // No fallback — undefined = production mode
// @ts-ignore
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
const SENDER_EMAIL = 'Sarah <onboarding@resend.dev>'

// --- Template ---
const INVITATION_TEMPLATE = (businessName: string, trackingLinks: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
    body { margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #0F172A; color: #F8FAFC; }
    .container { max-width: 600px; margin: 40px auto; background: #1E293B; border-radius: 24px; overflow: hidden; border: 1px solid #334155; }
    .hero { background: linear-gradient(135deg, #F59E0B 0%, #B45309 100%); padding: 48px 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; color: #FFFFFF; border: 2px solid rgba(255,255,255,0.3); display: inline-block; padding: 8px 16px; border-radius: 12px; margin-bottom: 8px; }
    .hero h1 { margin: 24px 0 0; color: #FFFFFF; font-size: 36px; }
    .content { padding: 48px 40px; }
    .greeting { font-size: 20px; color: #94A3B8; margin-bottom: 24px; }
    .lead-text { font-size: 18px; line-height: 1.6; color: #E2E8F0; margin-bottom: 32px; }
    .highlight { color: #FBBF24; font-weight: 600; }
    .card { background: #0F172A; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 32px; display: flex; gap: 16px; align-items: center; }
    .card-icon { font-size: 24px; width: 48px; height: 48px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .card-text { font-size: 15px; color: #CBD5E1; margin: 0; }
    .button { background: linear-gradient(to right, #F59E0B, #D97706); color: #FFF; padding: 18px 48px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 18px; display: inline-block; }
    .footer { background: #0F172A; padding: 32px; text-align: center; border-top: 1px solid #334155; }
    .footer p { margin: 8px 0; font-size: 13px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div class="logo">KOSMOI</div>
      <h1>Koh Samui is Calling.</h1>
    </div>
    <div class="content">
      <p class="greeting">Sawasdee <strong>${businessName}</strong>,</p>
      <p class="lead-text">Our 'Island Crawler' AI has specifically identified your business as a <span class="highlight">Hidden Gem</span>.</p>
      <div class="card">
        <div class="card-icon">💎</div>
        <p class="card-text">We've created a preliminary <strong>Premium Profile</strong> for you on Kosmoi - the new digital heart of the island.</p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${trackingLinks.click}" class="button">Claim Your Profile Free</a>
      </div>
      <p style="font-size: 13px; color: #64748B; text-align: center;">No credit card required. Verify ownership in 30 seconds.</p>
    </div>
    <div class="footer">
      <p>Sent autonomously by <strong>Sarah</strong> (AI Sales Coordinator)</p>
      <p>Protocol ID: 626-CLOUD • Node: SAMUI-SOUTH</p>
    </div>
    <!-- Open Tracking Pixel -->
    <img src="${trackingLinks.open}" alt="" width="1" height="1" style="display:none;" />
  </div>
</body>
</html>
`;

// @ts-ignore
serve(async (req: Request) => {
    try {
        const payload = await req.json().catch(() => ({}));
        const { action = 'invite_leads', lat, lng, radius = 1000, type = 'restaurant' } = payload;

        console.log(`🚀 Sales Scout Action: ${action}`);

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // ------------------------------------------------------------------
        // ACTION: SCOUT LOCATION (Importers Google Data)
        // ------------------------------------------------------------------
        if (action === 'scout_location') {
            if (!lat || !lng) return new Response("Missing lat/lng", { status: 400 });
            if (!GOOGLE_MAPS_API_KEY) return new Response("Missing Google Maps API Key", { status: 500 });

            console.log(`🌍 Scouting area: ${lat}, ${lng} (r=${radius}m)`);

            // 1. Fetch from Google
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
            const gResp = await fetch(url);
            const gData = await gResp.json();

            if (gData.status !== 'OK') {
                console.error("Google API Error:", gData);
                return new Response(JSON.stringify({ error: gData.status, message: gData.error_message }), { status: 500 });
            }

            const results = gData.results || [];
            console.log(`📍 Found ${results.length} places from Google`);

            let newCount = 0;
            const imported = [];

            // 2. Upsert to Supabase
            for (const place of results) {
                // Map Google Types to our Categories
                let category = 'other';
                if (place.types.includes('restaurant') || place.types.includes('food')) category = 'restaurant';
                if (place.types.includes('lodging') || place.types.includes('hotel')) category = 'accommodation';
                if (place.types.includes('spa') || place.types.includes('health')) category = 'wellness';
                if (place.types.includes('store') || place.types.includes('shopping_mall')) category = 'shopping';

                const { data, error } = await supabaseClient
                    .from('service_providers')
                    .upsert({
                        google_place_id: place.place_id,
                        business_name: place.name,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        location: place.vicinity || place.formatted_address,
                        average_rating: place.rating || 0,
                        total_reviews: place.user_ratings_total || 0,
                        status: 'active', // Active immediately so they appear on map
                        category: category,
                        verified: false, // Not claimed yet
                        images: place.photos ? place.photos.map((p: any) =>
                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                        ) : [],
                        // Store raw google data for future use
                        metadata: {
                            google_types: place.types,
                            google_scope: place.scope
                        }
                    }, { onConflict: 'google_place_id' })
                    .select()
                    .single();

                if (!error) {
                    newCount++;
                    // @ts-ignore
                    imported.push(data);
                } else {
                    console.error(`Failed to upsert ${place.name}:`, error);
                }
            }

            console.log(`✅ Successfully imported/updated ${newCount} businesses`);

            // Signal: new leads found — brain knows the pipeline has been refreshed
            if (newCount > 0) {
                await supabaseClient.rpc('write_signal', {
                    p_event_type: 'leads.batch_scouted',
                    p_entity_type: 'system',
                    p_entity_id: null,
                    p_source: 'sales-scout',
                    p_data: {
                        count: newCount,
                        area: { lat, lng, radius },
                        category_filter: type,
                        new_leads: imported.map((p: any) => ({ id: p.id, name: p.business_name, category: p.category }))
                    }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                count: newCount,
                places: imported.map((p: any) => ({ id: p.id, name: p.business_name }))
            }), { headers: { "Content-Type": "application/json" } });
        }

        // ------------------------------------------------------------------
        // ACTION: SCOUT DETAILS (Specific Place ID) - For Clickable POIs
        // ------------------------------------------------------------------
        if (action === 'scout_details') {
            const { place_id } = payload;
            if (!place_id) return new Response("Missing place_id", { status: 400 });

            console.log(`🎯 Scouting specific target: ${place_id}`);

            // 1. Fetch Details from Google
            const fields = 'place_id,name,formatted_address,geometry,photos,types,website,international_phone_number,rating,user_ratings_total,vicinity';
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

            const gResp = await fetch(url);
            const gData = await gResp.json();

            if (gData.status !== 'OK') {
                return new Response(JSON.stringify({ error: gData.status, message: gData.error_message }), { status: 500 });
            }

            const place = gData.result;

            // 2. Map Category
            let category = 'other';
            if (place.types?.includes('restaurant') || place.types?.includes('food')) category = 'restaurant';
            else if (place.types?.includes('lodging') || place.types?.includes('hotel')) category = 'accommodation';
            else if (place.types?.includes('spa') || place.types?.includes('health')) category = 'wellness';
            else if (place.types?.includes('store') || place.types?.includes('shopping_mall')) category = 'shopping';

            // 3. Upsert
            const { data, error } = await supabaseClient
                .from('service_providers')
                .upsert({
                    google_place_id: place.place_id,
                    business_name: place.name,
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    location: place.formatted_address || place.vicinity,
                    average_rating: place.rating || 0,
                    total_reviews: place.user_ratings_total || 0,
                    status: 'active',
                    category: category,
                    verified: false,
                    phone: place.international_phone_number,
                    website: place.website,
                    images: place.photos ? place.photos.map((p: any) =>
                        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                    ) : [],
                    metadata: {
                        google_types: place.types,
                        scouted_at: new Date().toISOString(),
                        method: 'click_scout'
                    }
                }, { onConflict: 'google_place_id' })
                .select()
                .single();

            if (error) {
                console.error("Upsert failed:", error);
                return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            }

            console.log(`✅ Scouted & Ingested: ${place.name}`);
            return new Response(JSON.stringify({ success: true, place: data }), { headers: { "Content-Type": "application/json" } });
        }

        // ------------------------------------------------------------------
        // ACTION: SEARCH PLACES (Text Search) - For Hybrid Search
        // ------------------------------------------------------------------
        if (action === 'search_places') {
            const { query } = payload;
            if (!query) return new Response("Missing query", { status: 400 });

            console.log(`🔎 Searching Google Places for: ${query}`);

            // Use Text Search (New)
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
            const gResp = await fetch(url);
            const gData = await gResp.json();

            if (gData.status !== 'OK' && gData.status !== 'ZERO_RESULTS') {
                return new Response(JSON.stringify({ error: gData.status, message: gData.error_message }), { status: 500 });
            }

            const results = gData.results || [];
            console.log(`📍 Found ${results.length} matches for search`);

            // Ingest Top 3
            const topMatches = results.slice(0, 3);
            const ingested = [];

            for (const place of topMatches) {
                let category = 'other';
                if (place.types?.includes('restaurant')) category = 'restaurant';
                else if (place.types?.includes('lodging')) category = 'accommodation';

                const { data, error } = await supabaseClient
                    .from('service_providers')
                    .upsert({
                        google_place_id: place.place_id,
                        business_name: place.name,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        location: place.formatted_address,
                        average_rating: place.rating || 0,
                        total_reviews: place.user_ratings_total || 0,
                        status: 'active',
                        category: category,
                        verified: false,
                        images: place.photos ? place.photos.map((p: any) =>
                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                        ) : [],
                        metadata: { method: 'hybrid_search', search_query: query }
                    }, { onConflict: 'google_place_id' })
                    .select()
                    .single();

                if (!error) ingested.push(data);
            }

            return new Response(JSON.stringify({ success: true, results: ingested }), { headers: { "Content-Type": "application/json" } });
        }


        // ------------------------------------------------------------------
        // ACTION: INVITE LEADS (Original Logic)
        // ------------------------------------------------------------------
        if (action === 'invite_leads') {
            console.log("🕵️‍♀️ Sarah (Cloud): Scouting for leads to invite...");

            // 1. Scout
            const { data: rawLeads } = await supabaseClient
                .from('service_providers')
                .select('id, business_name, phone, category, email')
                .eq('verified', false)
                .eq('status', 'active')
                .neq('category', 'culture')
                .neq('category', 'temple') // Filter
                .limit(5);

            if (!rawLeads || rawLeads.length === 0) return new Response(JSON.stringify({ message: "No leads" }), { headers: { "Content-Type": "application/json" } });

            let targetLead = null;
            for (const lead of rawLeads) {
                const { data: existing } = await supabaseClient
                    .from('invitations')
                    .select('id')
                    .eq('service_provider_id', lead.id)
                    .maybeSingle();
                if (!existing) { targetLead = lead; break; }
            }

            if (!targetLead) return new Response(JSON.stringify({ message: "All invited" }), { headers: { "Content-Type": "application/json" } });

            console.log(`💌 Target: ${targetLead.business_name}`);

            // FIXED: Use the real business email when available.
            // TEST_EMAIL is only used as a fallback during active development testing.
            // In production (TEST_EMAIL is not set), skip leads with no email
            // and log as a signal so the brain can decide on WhatsApp outreach instead.
            const realBusinessEmail = targetLead.email;
            const recipientEmail = realBusinessEmail || TEST_EMAIL;

            if (!recipientEmail) {
                // No email for this lead — log as signal for future WhatsApp/LINE routing
                await supabaseClient.rpc('write_signal', {
                    p_event_type: 'lead.no_email',
                    p_entity_type: 'provider',
                    p_entity_id: targetLead.id,
                    p_source: 'sales-scout',
                    p_data: {
                        business_name: targetLead.business_name,
                        phone: targetLead.phone,
                        category: targetLead.category,
                        message: 'Lead has no email — requires WhatsApp/LINE outreach'
                    }
                });
                console.log(`⚠️ No email for ${targetLead.business_name} — logged signal for WhatsApp routing`);
                return new Response(JSON.stringify({ message: "Lead has no email", lead_id: targetLead.id, next_channel: "whatsapp" }), { headers: { "Content-Type": "application/json" } });
            }

            const isTestMode = !!TEST_EMAIL;
            if (isTestMode) {
                console.log(`⚠️ TEST MODE: Routing ${targetLead.business_name} email to ${recipientEmail} (real: ${realBusinessEmail || 'none'})`);
            } else {
                console.log(`📧 PRODUCTION: Sending to real business email: ${recipientEmail}`);
            }

            // 2. INSERT INVITATION (Sending State)
            const { data: invite, error: dbError } = await supabaseClient
                .from('invitations')
                .insert({
                    service_provider_id: targetLead.id,
                    token: crypto.randomUUID(),
                    status: 'pending',
                    metadata: {
                        channel: 'email',
                        target_email: recipientEmail,
                        real_business_email: realBusinessEmail || 'none',
                        is_test_mode: isTestMode,
                        sender: 'sales-scout-cloud',
                        stage: 'sending'
                    }
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Generate Tracking Links
            // @ts-ignore
            const baseUrl = Deno.env.get('SUPABASE_URL').replace('.co', '.co/functions/v1');
            const realClaimLink = `https://kosmoi.site/claim?id=${targetLead.id}`;

            const trackingLinks = {
                open: `${baseUrl}/track-invitation?id=${invite.id}&type=open`,
                click: `${baseUrl}/track-invitation?id=${invite.id}&type=click&url=${encodeURIComponent(realClaimLink)}`
            };

            // 4. Generate Content
            const emailHtml = INVITATION_TEMPLATE(targetLead.business_name, trackingLinks);

            // 5. Send via Resend
            let emailSent = false;
            if (RESEND_API_KEY) {
                try {
                    const resendResp = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: SENDER_EMAIL,
                            to: recipientEmail,
                            subject: `Invitation for ${targetLead.business_name} - Kosmoi`,
                            html: emailHtml
                        })
                    });
                    if (resendResp.ok) {
                        emailSent = true;
                    } else {
                        const errBody = await resendResp.json().catch(() => ({}));
                        console.error('Resend error:', resendResp.status, errBody);
                    }
                } catch (e) { console.error("Resend err", e); }
            } else {
                console.error('RESEND_API_KEY not set — cannot send invitation');
            }

            // 6. Update Status + Write Signal
            if (emailSent) {
                await supabaseClient.from('invitations').update({
                    status: 'pending',
                    metadata: { ...invite.metadata, stage: 'sent', sent_at: new Date().toISOString() }
                }).eq('id', invite.id);

                // Signal: invitation was sent — brain tracks outreach pipeline
                await supabaseClient.rpc('write_signal', {
                    p_event_type: 'invitation.sent',
                    p_entity_type: 'provider',
                    p_entity_id: targetLead.id,
                    p_source: 'sales-scout',
                    p_data: {
                        invite_id: invite.id,
                        business_name: targetLead.business_name,
                        category: targetLead.category,
                        recipient_email: recipientEmail,
                        is_real_email: !!realBusinessEmail,
                        channel: 'email'
                    }
                });

                console.log(`✅ Sent & Tracked: ${invite.id}`);
            } else {
                await supabaseClient.from('invitations').update({
                    status: 'failed',
                    metadata: { ...invite.metadata, stage: 'failed' }
                }).eq('id', invite.id);

                // Signal: send failure — brain can retry or flag for review
                await supabaseClient.rpc('write_signal', {
                    p_event_type: 'invitation.send_failed',
                    p_entity_type: 'provider',
                    p_entity_id: targetLead.id,
                    p_source: 'sales-scout',
                    p_data: {
                        invite_id: invite.id,
                        business_name: targetLead.business_name,
                        reason: 'both_n8n_and_resend_failed'
                    }
                });

                return new Response(JSON.stringify({ error: "Send Failed" }), { status: 500 });
            }

            return new Response(JSON.stringify({ success: true, invite_id: invite.id }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response("Unknown Action", { status: 400 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
})
