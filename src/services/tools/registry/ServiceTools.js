import { ToolRegistry } from "../ToolRegistry.js";
import { AgentTools } from "../../AgentTools.js";

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

ToolRegistry.register("create_booking", async (payload) => {
    // payload: { userId, providerId, serviceType, date, startTime, endTime }
    return await AgentTools.createBooking(payload);
}, "Create a new booking. Params: { userId, providerId, serviceType, date, startTime, endTime }");

console.log("✅ ServiceTools Registered");
