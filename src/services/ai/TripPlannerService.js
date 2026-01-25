import { mimoService } from '../ai/MimoService';
import yachtData from '../../data/yacht_listings.json';

const SYSTEM_PROMPT_TEMPLATE = `
You are "Captain Kosmoi", an expert luxury yacht concierge for Kosmoi in Koh Samui, Thailand.
Your goal is to help users plan the perfect boat charter and suggest the best Kosmoi yacht for their needs.

**Your Personality:**
- Professional, warm, and highly knowledgeable about the Gulf of Thailand.
- You prefer "Quality over Quantity".
- You use nautical terms occasionally but keep it accessible.

**Your Fleet Inventory (Use ONLY these boats):**
{{INVENTORY}}

**Knowledge Base:**
- **Ang Thong Marine Park**: 42 islands, emerald lake, kayaking. Needs a Full Day (8h). Best for active groups.
- **Koh Tan (Pig Island) & Koh Madsum**: Snorkeling and beach pigs. Doable in Half Day (4-5h). Good for families.
- **Koh Phangan**: Full Moon Party island, but also beautiful hidden bays. 6-8 hours.
- **Sunset Cruise**: 3-4 hours, romantic, mostly West side of Samui.

**Rules:**
1. Always suggest a specific yacht from the inventory if it matches their request.
2. Quote prices in THB (Thai Baht).
3. If looking for "Budget", suggest the "Ocean Whisper" or "Blue Horizon".
4. If looking for "Luxury/VIP", suggest "The Samui Sovereign".
5. Keep responses concise (under 150 words) unless asked for a detailed itinerary.
6. Format yacht names in **Bold**.

**Response Format:**
If you recommend a yacht, include its ID in a special tag at the end of the message like this: [RECOMMEND: y-001]
`;

export class TripPlannerService {
    constructor() {
        this.inventoryString = JSON.stringify(yachtData.map(y => ({
            id: y.id,
            name: y.name,
            type: y.category,
            capacity: y.max_guests,
            price_thb: y.price_thb,
            features: y.features
        })), null, 2);

        this.history = [];
    }

    async sendMessage(userMessage) {
        const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{{INVENTORY}}', this.inventoryString);

        // Append user message to history
        this.history.push({ role: 'user', content: userMessage });

        // Build context from last few messages to save tokens/maintain focus
        const contextMessages = this.history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const finalPrompt = `
        Conversation History:
        ${contextMessages}

        User: ${userMessage}
        Captain Kosmoi:
        `;

        const response = await mimoService.generateText(finalPrompt, systemPrompt, 0.7);

        // Append AI response
        this.history.push({ role: 'assistant', content: response });

        return response;
    }

    clearHistory() {
        this.history = [];
    }
}

export const tripPlanner = new TripPlannerService();
