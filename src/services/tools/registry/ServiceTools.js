import { ToolRegistry } from "../ToolRegistry.js";
import { AgentTools } from "../../../features/agents/services/AgentTools.js";
import { StripeService } from "../../../services/payments/StripeService.js";
import { mimoService } from "../../ai/MimoService.js";

/**
 * Service Tools: Empower agents to interact with the Kosmoi Marketplace.
 * - Find Providers
 * - Check Availability
 * - Book Services
 */

ToolRegistry.register("search_providers", "Search for service providers in the marketplace.", { query: "string" }, async (payload) => {
    // payload: { query: string }
    return await AgentTools.searchProviders(payload.query);
});

ToolRegistry.register("check_availability", "Check if a provider is available on a specific date.", { providerId: "string", date: "string" }, async (payload) => {
    // payload: { providerId: string, date: string }
    return await AgentTools.checkAvailability(payload.providerId, payload.date);
});

ToolRegistry.register("create_booking", "Create a new service booking.", { userId: "string", providerId: "string", serviceType: "string", date: "string", startTime: "string", endTime: "string" }, async (payload) => {
    // payload: { userId, providerId, serviceType, date, startTime, endTime }
    return await AgentTools.createBooking(payload);
});

ToolRegistry.register("create_payment_link", "Generate a Stripe payment link for a product.", { businessName: "string", product_name: "string", amount: "number", currency: "string" }, async (payload) => {
    // payload: { businessName, productName/product_name, amount, currency }
    // Support both snake_case (agent output) and camelCase (internal)
    const productName = payload.productName || payload.product_name;
    const businessName = payload.businessName || payload.business_name || "Kosmoi Inc";

    return await StripeService.createPaymentLink(
        businessName,
        productName,
        payload.amount,
        payload.currency || 'usd'
    );
});

console.log("✅ ServiceTools Registered");

ToolRegistry.register("ask_mimo", "Ask the Mimo V2 Flash LLM for assistance.", { prompt: "string", temperature: "number" }, async (payload) => {
    // payload: { prompt: string, temperature?: number }
    try {
        const response = await mimoService.generateText(payload.prompt, undefined, payload.temperature);
        return `[Mimo] ${response}`;
    } catch (e) {
        return `[Error] Mimo generation failed: ${e.message}`;
    }
});
