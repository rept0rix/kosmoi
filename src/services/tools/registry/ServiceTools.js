import { ToolRegistry } from "../ToolRegistry.js";
import { AgentTools } from "../../../features/agents/services/AgentTools.js";

/**
 * Service Tools: Empower agents to interact with the Kosmoi Marketplace.
 * - Find Providers
 * - Check Availability
 * - Book Services
 */

ToolRegistry.register("search_providers", async (payload) => {
    // payload: { query: string }
    return await AgentTools.searchProviders(payload.query);
}, "Search for service providers. Params: { query: 'string' }");

ToolRegistry.register("check_availability", async (payload) => {
    // payload: { providerId: string, date: string }
    return await AgentTools.checkAvailability(payload.providerId, payload.date);
}, "Check provider availability. Params: { providerId: 'uuid', date: 'YYYY-MM-DD' }");

import { StripeService } from "../../../services/payments/StripeService.js";

ToolRegistry.register("create_booking", async (payload) => {
    // payload: { userId, providerId, serviceType, date, startTime, endTime }
    return await AgentTools.createBooking(payload);
}, "Create a new booking. Params: { userId, providerId, serviceType, date, startTime, endTime }");

ToolRegistry.register("create_payment_link", async (payload) => {
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
}, "Create a Stripe payment link. Params: { productName OR product_name, amount, currency?, businessName? }");

console.log("✅ ServiceTools Registered");

import { mimoService } from "../../ai/MimoService.js";

ToolRegistry.register("ask_mimo", async (payload) => {
    // payload: { prompt: string, temperature?: number }
    try {
        const response = await mimoService.generateText(payload.prompt, undefined, payload.temperature);
        return `[Mimo] ${response}`;
    } catch (e) {
        return `[Error] Mimo generation failed: ${e.message}`;
    }
}, "Ask Xiaomi Mimo V2 Flash (faster/cheaper LLM). Params: { prompt: 'string' }");
