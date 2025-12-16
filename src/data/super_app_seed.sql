-- Seed Data for Real Estate
INSERT INTO properties (
        title,
        description,
        price,
        location,
        type,
        agent_id,
        status
    )
VALUES (
        'Sunset Paradise Villa',
        'Stunning 4-bedroom villa with infinity pool overlooking the ocean. Perfect for sunsets.',
        25000000,
        'Taling Ngam',
        'sale',
        '00000000-0000-0000-0000-000000000000',
        'active'
    ),
    (
        'Modern Condo in Chaweng',
        'Sleek 1-bedroom condo in the heart of Chaweng. Walking distance to the beach and mall.',
        3500000,
        'Chaweng',
        'sale',
        '00000000-0000-0000-0000-000000000000',
        'active'
    ),
    (
        'Jungle Retreat Bungalow',
        'Peaceful 2-bedroom bungalow surrounded by coconut palms. Long term rent available.',
        25000,
        'Maenam',
        'rent',
        '00000000-0000-0000-0000-000000000000',
        'active'
    );
-- Seed Images for Properties (Assuming generated IDs - this part is tricky in raw SQL without variables, 
-- but for a demo we can try subqueries or just manual insertion if we knew IDs. 
-- For robustness, we will omit complex relationships here or use a DO block if supported by the tool, but simple INSERTs are safer).
-- Actually, let's just insert one image for the FIRST property found to verify.
INSERT INTO property_images (property_id, url)
SELECT id,
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80'
FROM properties
WHERE title = 'Sunset Paradise Villa'
LIMIT 1;
-- Seed Data for Experiences
INSERT INTO experiences (
        title,
        description,
        price,
        duration,
        category,
        location,
        image_url,
        rating,
        reviews_count
    )
VALUES (
        'Ang Thong Marine Park VIP Tour',
        'Experience the 42 islands of Ang Thong Marine Park on a luxury speedboat. Includes lunch and kayaking.',
        2200,
        '8 Hours',
        'Adventure',
        'Nathon Pier',
        'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80',
        4.9,
        120
    ),
    (
        'Authentic Thai Cooking Class',
        'Learn to cook 4 classic Thai dishes with organic ingredients from our own garden.',
        1500,
        '3 Hours',
        'Culture',
        'Bophut',
        'https://images.unsplash.com/photo-1566559535070-d9da8dd74521?w=800&q=80',
        4.8,
        85
    ),
    (
        'Elephant Mud Spa',
        'Ethical elephant interaction. No riding. Feed, walk, and bathe with these gentle giants.',
        2500,
        '4 Hours',
        'Nature',
        'Maenam',
        'https://images.unsplash.com/photo-1585970280421-2e3fb731c362?w=800&q=80',
        5.0,
        200
    ),
    (
        'Jet Ski Safari',
        'Adrenaline pumping tour around the northern coast of Samui.',
        3500,
        '2 Hours',
        'Water Sports',
        'Maenam Beach',
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80',
        4.7,
        50
    );
-- Seed Service Provider (This usually requires a linked User ID, so we skip mocking this unless we have a known UID)