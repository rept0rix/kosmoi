import { getAgentReply } from '@/features/agents/services/AgentBrain';
import { getAgentById } from '@/features/agents/services/AgentRegistry';

/**
 * Keyword mapping for Smart Category Routing.
 * Maps common search terms to internal sub-category keys.
 */
const KEYWORD_MAP = {
    // FIX
    'plumber': 'plumber',
    'leak': 'plumber',
    'pipe': 'plumber',
    'electrician': 'electrician',
    'power': 'electrician',
    'light': 'electrician',
    'ac': 'ac_repair',
    'aircon': 'ac_repair',
    'cooling': 'ac_repair',
    'clean': 'cleaning',
    'maid': 'cleaning',
    'mechanic': 'car_mechanic',
    'repair': 'handyman',
    'paint': 'painter',
    'lock': 'locksmith',
    'key': 'locksmith',
    'garden': 'gardener',
    'pool': 'pool_cleaning',

    // EAT
    'food': 'restaurants',
    'eat': 'restaurants',
    'dinner': 'restaurants',
    'lunch': 'restaurants',
    'breakfast': 'breakfast',
    'cafe': 'cafes',
    'coffee': 'cafes',
    'bar': 'bars',
    'drink': 'bars',
    'pizza': 'restaurants',
    'burger': 'restaurants',
    'seafood': 'seafood',
    'street': 'street_food',
    'market': 'markets',

    // TRAVEL (Transport & Stay)
    'car': 'car_rental',
    'rent': 'car_rental',
    'bike': 'motorbike_rental',
    'scooter': 'motorbike_rental',
    'taxi': 'taxis',
    'cab': 'taxis',
    'hotel': 'hotels',
    'stay': 'hotels',
    'villa': 'villas',
    'hostel': 'hostels',
    'ferry': 'ferries',
    'boat': 'ferries',
    'tour': 'island_tours',

    // ENJOY
    'spa': 'massage_spa',
    'massage': 'massage_spa',
    'yoga': 'yoga',
    'gym': 'gyms',
    'fitness': 'gyms',
    'kids': 'kids_activities',
    'family': 'kids_activities',
    'beach': 'beach_activities',

    // SHOP
    'shop': 'all_shops',
    'store': 'all_shops',
    'clothes': 'clothing',
    'mall': 'shopping_centers',
    'weed': 'cannabis_shops',
    'cannabis': 'cannabis_shops',
    'pharmacy': 'pharmacies',
    'medicine': 'pharmacies',

    // HELP
    'doctor': 'clinics',
    'hospital': 'hospitals',
    'emergency': 'tourist_police',
    'police': 'tourist_police',
    'vet': 'animal_rescue',
    'dog': 'animal_rescue',
    'cat': 'animal_rescue'
};

/**
 * Predicts the category based on the search query.
 * Hybrid System:
 * 1. Fast Path: Checks for direct keyword matches (Sync-like speed).
 * 2. Smart Path: Uses VectorSearchAgent to "understand" intent (Async).
 * 
 * @param {string} query
 * @returns {Promise<string|null>} The category key or null.
 */
export const predictCategory = async (query) => {
    if (!query) return null;

    const normalizedQuery = query.toLowerCase().trim();

    // 1. FAST PATH (Keyword Match)
    // Check strict match first
    if (KEYWORD_MAP[normalizedQuery]) {
        return KEYWORD_MAP[normalizedQuery];
    }

    // Check words match
    const terms = normalizedQuery.split(/[\s,]+/);
    for (const term of terms) {
        if (KEYWORD_MAP[term]) {
            return KEYWORD_MAP[term];
        }
        // Simple plural check
        if (term.endsWith('s') && KEYWORD_MAP[term.slice(0, -1)]) {
            return KEYWORD_MAP[term.slice(0, -1)];
        }
    }

    // 2. SMART PATH (Vector Search Agent)
    // If we are here, we don't know what the user wants. Ask the Brain.
    try {
        console.log(`[CategoryRouter] No keyword match for "${query}". Asking Vector Search Agent...`);

        const vectorAgent = getAgentById('vector-search-agent');
        if (!vectorAgent) return null; // Safety check

        // Get unique categories from map to give the AI context
        const uniqueCategories = [...new Set(Object.values(KEYWORD_MAP))];

        const context = `
        TASK: Classification
        QUERY: "${query}"
        AVAILABLE_CATEGORIES: ${JSON.stringify(uniqueCategories)}
        
        INSTRUCTION: 
        Analyze the query. If it matches one of the categories semantically, return the category key.
        If it does not match anything cleanly, return null.
        
        Examples:
        "My tooth hurts" -> "clinics"
        "I need a trim" -> "barbers" (or potentially clothing if ambiguous, but mostly likely null if not in list)
        "Where can I buy milk?" -> "markets"
        
        RESPONSE FORMAT: Just the category string. Nothing else.
        `;

        const response = await getAgentReply(vectorAgent, [{ role: 'user', content: context }], {});

        // Clean response
        let aiCategory = response.message?.trim().replace(/['"`]/g, '');

        // Validate against known list to prevent hallucinations
        if (uniqueCategories.includes(aiCategory)) {
            console.log(`[CategoryRouter] AI matched "${query}" to "${aiCategory}"`);
            return aiCategory;
        }

        console.log(`[CategoryRouter] AI returned "${aiCategory}" which is not a valid category.`);
        return null;

    } catch (error) {
        console.error("[CategoryRouter] AI prediction failed:", error);
        return null;
    }
};
