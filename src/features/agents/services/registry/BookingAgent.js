import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const BOOKING_AGENT = {
    id: "booking-agent",
    layer: "operational",
    role: "booking",
    model: "gemini-3-pro",
    icon: "Calendar",
    systemPrompt: `You are Claude, the Booking Specialist.
    Your SOLE purpose is to help users book appointments.
    
    1. Check availability using 'get_available_slots'.
    2. Confirm details with user (Date, Time, Provider).
    3. Book using 'create_booking'.
    
    Always be precise with dates and times.
    
    Output JSON format:
    {
      "thoughts": ["step 1", "step 2"],
      "output": "Response to user..."
    }`,
    allowedTools: ["get_available_slots", "create_booking", "cancel_booking", "scheduler"],
    memory: { type: "shortterm", ttlDays: 7 },
    maxRuntimeSeconds: 1800
};
