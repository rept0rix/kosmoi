import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import 'dotenv/config';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

function normalizeUrl(url) {
    if (!url) return null;
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
}

async function scrapeProvider(page, provider) {
    console.log(`\n🔍 Searching for: ${provider.business_name} (Koh Samui)...`);

    let findings = {
        phone: null,
        website: null,
        socials: []
    };

    try {
        // 1. Google Search for the business
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(provider.business_name + " Koh Samui official site")}`, { waitUntil: 'domcontentloaded' });
        await delay(1500 + Math.random() * 1000);

        // a. Try to find an official website link (ignoring common directories)
        const websiteUrl = await page.evaluate(() => {
            const ignoreList = ['facebook.com', 'tripadvisor.com', 'booking.com', 'agoda.com', 'hotels.com', 'expedia.com', 'instagram.com', 't.co', 'youtube.com'];
            const links = Array.from(document.querySelectorAll('div.g a'));

            for (const link of links) {
                const href = link.href;
                if (!href) continue;
                if (ignoreList.some(domain => href.includes(domain))) continue;
                if (!href.startsWith('http')) continue;
                return href;
            }
            return null;
        });

        // b. If no official site, look for a Facebook link as fallback
        const facebookUrl = await page.evaluate(() => {
            const link = document.querySelector('a[href*="facebook.com"]');
            return link ? link.href : null;
        });

        if (websiteUrl) {
            console.log(`   🌐 Found Website: ${websiteUrl}`);
            findings.website = websiteUrl;

            // 2. Visit the website to extract info
            try {
                await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await delay(2000); // Wait for dynamic content

                const siteData = await page.evaluate(() => {
                    const phoneRegex = /(\+66|0)[0-9- ]{8,}/g; // Basic Thai phone regex
                    const bodyText = document.body.innerText;

                    // Extract Phone
                    const phones = bodyText.match(phoneRegex) || [];
                    const bestPhone = phones.length > 0 ? phones[0].trim() : null;

                    // Extract Socials
                    const socialLinks = [];
                    const links = Array.from(document.querySelectorAll('a[href]'));
                    links.forEach(l => {
                        if (l.href.includes('facebook.com') || l.href.includes('instagram.com') || l.href.includes('line.me')) {
                            socialLinks.push(l.href);
                        }
                    });

                    return { phone: bestPhone, socials: [...new Set(socialLinks)] };
                });

                findings.phone = siteData.phone;
                findings.socials = siteData.socials;

            } catch (err) {
                console.log(`   ⚠️ Could not load website: ${err.message}`);
            }
        } else if (facebookUrl) {
            console.log(`   blue_circle Found Facebook: ${facebookUrl}`);
            findings.socials.push(facebookUrl);
        }

        console.log(`   Found: Phone=${findings.phone || 'N/A'}, Web=${findings.website || 'N/A'}, Socials=${findings.socials.length}`);
        return findings;

    } catch (e) {
        console.error(`   ❌ Scraping error for ${provider.business_name}:`, e.message);
        return null;
    }
}

async function main() {
    console.log("🚀 Starting Enhanced Enrichment Agent...");

    // 1. Get Providers (checking for missing data)
    const { data: providers, error } = await supabase
        .from('service_providers')
        .select('id, business_name, phone, website, contact_info')
        .or('phone.is.null,website.is.null,contact_info.is.null')
        .limit(10); // Batch of 10

    if (error) {
        console.error("Supabase Error:", error);
        process.exit(1);
    }

    if (!providers || providers.length === 0) {
        console.log("✅ No providers need enrichment.");
        process.exit(0);
    }

    console.log(`📋 Found ${providers.length} providers to process.`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const provider of providers) {
        const enriched = await scrapeProvider(page, provider);

        if (enriched && (enriched.phone || enriched.website || enriched.socials.length > 0)) {
            const updates = {};
            if (enriched.phone && !provider.phone) updates.phone = enriched.phone;
            if (enriched.website && !provider.website) updates.website = enriched.website;

            // Enrich contact_info
            const currentContact = provider.contact_info || {};
            updates.contact_info = {
                ...currentContact,
                social_links: [...(currentContact.social_links || []), ...enriched.socials]
            };
            // Dedupe socials
            updates.contact_info.social_links = [...new Set(updates.contact_info.social_links)];

            const { error: updateErr } = await supabase
                .from('service_providers')
                .update(updates)
                .eq('id', provider.id);

            if (updateErr) console.error("   ❌ DB Update Failed:", updateErr.message);
            else console.log("   ✅ Database Updated.");
        } else {
            console.log("   (No new data found)");
        }
    }

    await browser.close();
}

main().catch(console.error);
