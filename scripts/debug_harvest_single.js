
import axios from 'axios';
import * as cheerio from 'cheerio';

const URL = 'https://samui-map.info/listing/morya-pharmacy-24/';

async function debugHarvest() {
    console.log(`🕷️ Debug Crawling: ${URL}`);
    try {
        const { data } = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);

        // 1. Basic Info
        const title = $('h1').first().text().trim();
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const content = $('.entry-content').text().trim() || $('article').text().trim();

        // 2. Contact Info (JSON-LD)
        let phone = '';
        let address = '';
        let latitude = '';
        let longitude = '';
        let openingHours = [];

        // Try to dump all JSON-LD for inspection
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                console.log(`\n📄 JSON-LD #${i}:`, JSON.stringify(json, null, 2));
            } catch (e) {
                console.error('JSON Parse Error', e.message);
            }
        });

        // 3. Visuals
        const images = [];
        $('.gallery-item img, .entry-content img, .listing-gallery img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src) images.push(src);
        });

        // 4. Sidebar/Meta Data (Often where hours/website/email hidden)
        // Inspect common listing classes
        const specificData = {};
        // Website
        const website = $('a:contains("Website"), a.website-link').attr('href');
        if (website) specificData.website = website;

        // Email
        const email = $('a[href^="mailto:"]').attr('href')?.replace('mailto:', '');
        if (email) specificData.email = email;

        console.log('\n--- EXTRACTED DATA ---');
        console.log('Title:', title);
        console.log('Meta Description:', metaDesc);
        console.log('Content Snippet:', content.substring(0, 200) + '...');
        console.log('Images Found:', images.length, images.slice(0, 3));
        console.log('Specific Extras:', specificData);

    } catch (err) {
        console.error('Crawl Error:', err.message);
    }
}

debugHarvest();
