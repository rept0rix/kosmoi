
export const CATEGORY_SEARCH_TERMS = {
    // EAT
    all_restaurants: 'restaurants',
    delivery: 'food delivery',
    thai_food: 'thai restaurant',
    western_food: 'western restaurant',
    cafes: 'cafe coffee shop',
    seafood: 'seafood restaurant',
    street_food: 'street food',
    fine_dining: 'fine dining restaurant',
    breakfast: 'breakfast brunch',
    bars: 'bar pub',
    beach_clubs: 'beach club',
    markets: 'night market food market',

    // FIX
    ac_repair: 'air conditioning repair',
    plumber: 'plumber',
    electrician: 'electrician',
    motorcycle_mechanic: 'motorcycle bike repair',
    car_mechanic: 'car repair mechanic',
    phone_repair: 'mobile phone repair',
    cleaning: 'cleaning service',
    laundry: 'laundry service',
    pool_maintenance: 'pool service',
    gardener: 'gardener',
    pest_control: 'pest control',
    construction: 'construction company',

    // SHOP
    all_shops: 'shopping mall',
    supermarkets: 'supermarket grocery',
    convenience_stores: 'convenience store 7-eleven',
    clothing: 'clothing store',
    pharmacies: 'pharmacy drug store',
    cannabis_shops: 'cannabis dispensary weed',
    electronics: 'electronics store com7',
    souvenirs: 'gift shop souvenir',
    furniture: 'furniture store home decor',

    // ENJOY
    massage_spa: 'massage spa',
    yoga: 'yoga studio',
    gyms: 'gym fitness center',
    muay_thai: 'muay thai gym',
    water_sports: 'water sports jet ski',
    cooking_classes: 'cooking class',
    beach_activities: 'beach club',
    kids_activities: 'kids playground indoor playground',

    // GO OUT
    night_clubs: 'night club',
    live_music: 'live music bar',
    pubs: 'pub',

    // TRAVEL
    motorbike_rental: 'motorbike rental scooter rental',
    car_rental: 'car rental',
    taxis: 'taxi service transport',
    ferries: 'ferry pier',
    island_tours: 'tour agency travel agency',
    hotels: 'hotel resort',
    villas: 'villa rental',
    hostels: 'hostel backpackers',

    // HELP
    hospitals: 'hospital',
    clinics: 'medical clinic',
    animal_rescue: 'veterinary clinic animal rescue',

    // GET SERVICE
    money_exchange: 'currency exchange money changer',
    real_estate: 'real estate agency property agent',
    coworking: 'coworking space',
    photographers: 'photographer studio',
    legal_accounting: 'law firm accounting firm',
    beauty: 'beauty salon hair salon nail'
};

export const CRAWLER_AREAS = [
    'Chaweng',
    'Lamai',
    'Bophut',
    'Fisherman\'s Village',
    'Maenam',
    'Nathon',
    'Bang Rak',
    'Choeng Mon',
    'Lipa Noi',
    'Taling Ngam',
    'Hua Thanon'
];

export const CRAWLER_STEPS = {
    IDLE: 'idle',
    SCOUTING: 'scouting',   // Finding places
    ENRICHING: 'enriching', // Getting details
    SAVING: 'saving',       // Writing to DB
    COMPLETE: 'complete',
    PAUSED: 'paused'
};
