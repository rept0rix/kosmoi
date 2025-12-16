-- Seed Blog Posts (SEO Optimized)
INSERT INTO posts (
        title,
        slug,
        excerpt,
        content,
        cover_image,
        tags,
        published,
        published_at,
        author_id
    )
VALUES (
        'Top 10 Hidden Beaches in Koh Samui You Must Visit',
        'top-10-hidden-beaches-koh-samui',
        'Escape the crowds and discover the secret shores of beautiful Koh Samui. From Silver Beach into the jungle coves.',
        '# Top 10 Hidden Beaches in Koh Samui

Koh Samui is famous for Chaweng and Lamai, but the real magic lies in its hidden coves. Here are our top picks for 2025.

## 1. Silver Beach (Crystal Bay)
Located between Chaweng and Lamai, this bay offers crystal clear waters and granite boulders reminiscent of the Seychelles. Perfect for snorkeling.

## 2. Coral Cove
A tiny strip of sand with amazing underwater life. It entails a steep walk down, but it is worth every step.

## 3. Maenam Beach (West End)
Quiet, deep waters, and facing Koh Phangan. The perfect spot for a sunset swim without the jet skis.

## 4. Taling Ngam
The "Virgin Coast" of Samui. Sunsets here are legendary.

## 5. Thongson Bay
A small northern beach near Plai Laem. very exclusive and quiet.

## 6. Ban Tai Beach
A thin strip of white sand, perfect for kids due to shallow waters.

## 7. Bang Por
Famous for seafood restaurants right on the sand.

## 8. Laem Yai
The north-west tip, great for walking at low tide.

## 9. Samrong Bay (Secret Beach)
Tucked away near Six Senses, this is true luxury privacy.

## 10. Nathon Sunset Beach
Not for swimming, but the best place to watch the sun go down with some street food.

### How to get there?
Rent a scooter from **Samui Service Hub** and explore at your own pace!
',
        'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80',
        ARRAY ['Travel', 'Beaches', 'Guide'],
        true,
        NOW() - INTERVAL '2 days',
        auth.uid() -- Will map to current user if run in SQL editor, or NULL in migration (fixed below)
    ),
    (
        'The Digital Nomad Guide to Koh Samui (2025 Edition)',
        'digital-nomad-guide-samui-2025',
        'Everything you need to know about coworking spaces, internet speeds, and visa runs in Samui.',
        '# Digital Nomad Life in Samui 💻

Koh Samui is becoming a top hub for remote workers. Here is why.

## Coworking Spaces
- **BeacHub**: Work right on the beach in Choeng Mon.
- **Garage**: Cool vibes in Chaweng.

## Internet Speed
Did you know Samui has fiber optic speeds averaging 500Mbps?

## Cost of Living
You can live comfortably on $1,500/month, including a pool villa rental and motorbike.

## Visas
Thailand''s new **LTR Visa** and **Destination Thailand Visa (DTV)** make it easier than ever to stay long-term.
',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        ARRAY ['Nomad', 'Work', 'Lifestyle'],
        true,
        NOW() - INTERVAL '5 days',
        auth.uid()
    ),
    (
        'Best Local Food Spots (Not Tourist Traps)',
        'best-local-food-samui',
        'Eat like a local. We reveal the best Som Tum, Pad Kra Pao, and Seafood spots that won''t break the bank.',
        '# Eat Like a Local 🌶️

Skip the expensive hotel food. Here is where the locals eat.

## 1. Phensiri (Chaweng)
Authentic southern Thai food. Spicy and delicious.

## 2. Kawin''s Kitchen
Great ambiance and even better Massaman Curry.

## 3. Supattra Thai Dining
Fresh seafood caught daily. 

## 4. Night Markets
Don''t miss the **Fisherman''s Village Walking Street** on Fridays. Best street food in town.
',
        'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
        ARRAY ['Food', 'Culture', 'Local'],
        true,
        NOW() - INTERVAL '10 days',
        auth.uid()
    ),
    (
        'Ultimate Full Moon Party Survival Guide',
        'full-moon-party-survival-guide',
        'Heading over to Koh Phangan? Here is how to party safe and enjoy the bucket drinks.',
        '# Full Moon Party Guide 🌕

Just a short boat ride from Samui lies the world-famous Full Moon Party.

## Tips for Survival
1. **Book your boat early**: Speedboats run all night from Bangrak.
2. **Wear shoes**: Broken glass on the beach is common.
3. **Drink water**: Hydrate between buckets!
4. **Don''t take valuables**: Leave your passport at the hotel.

## Recovery
Book a spa day in Samui for the day after. You will need it.
',
        'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&q=80',
        ARRAY ['Party', 'Events', 'Guide'],
        true,
        NOW() - INTERVAL '20 days',
        auth.uid()
    ),
    (
        'Investing in Samui Real Estate: 2025 Outlook',
        'investing-samui-real-estate-2025',
        'Why now is the time to buy a villa in Koh Samui. ROI analysis and market trends.',
        '# Real Estate Boom 2025 🏠

Samui is seeing a surge in property investment.

## Why Buy?
- **Tourism Rebound**: Visitor numbers are exceeding 2019 levels.
- **Infrastructure**: New airport terminal and roads.
- **Rental Yields**: Expect 8-10% ROI on managed villas.

## Hot Areas
- **Plai Laem**: Near the airport and luxury hotels.
- **Maenam**: Quiet and up-and-coming.

Check out our **Real Estate Hub** to see current listings!
',
        'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80',
        ARRAY ['Real Estate', 'Investment', 'Business'],
        true,
        NOW() - INTERVAL '1 day',
        auth.uid()
    );