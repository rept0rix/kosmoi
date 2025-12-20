import { ToolRegistry } from "../ToolRegistry.js";
import { AgentTools } from "@/features/agents/services/AgentTools.js";

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

import { StripeService } from "@/services/payments/StripeService.js";

ToolRegistry.register("create_booking", async (payload) => {
    // payload: { userId, providerId, serviceType, date, startTime, endTime }
    return await AgentTools.createBooking(payload);
}, "Create a new booking. Params: { userId, providerId, serviceType, date, startTime, endTime }");

ToolRegistry.register("create_payment_link", async (payload) => {
    // payload: { businessName, productName, amount, currency }
    return await StripeService.createPaymentLink(
        payload.businessName || "Kosmoi Inc",
        payload.productName,
        payload.amount,
        payload.currency
    );
}, "Create a Stripe payment link. Params: { productName, amount, currency, businessName? }");

console.log("✅ ServiceTools Registered");
