import { ToolRegistry } from "../ToolRegistry.js";
import { BookingService } from "../../BookingService.js";
import { PaymentService } from "../../PaymentService.js";
import { GenerateImage, CreatePaymentLink } from "../../../api/integrations.js";

// --- CREATIVE TOOLS ---
ToolRegistry.register("generate_image", async (payload) => {
    return await GenerateImage({
        prompt: payload.prompt,
        aspectRatio: payload.aspectRatio
    });
});

ToolRegistry.register("nano_banana_api", async (payload) => {
    const prompt = payload.prompt || "abstract design";
    const style = payload.style || "modern";
    const enhancedPrompt = `${prompt}, ${style} style, high quality, professional design, vector art`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    return `[Nano Banana Pro] Image generated successfully: ![Generated Image](${imageUrl})\nURL: ${imageUrl}`;
});

// --- CALENDAR TOOLS ---
ToolRegistry.register("calendar-api", async (payload) => {
    const { action } = payload;
    try {
        if (action === "get_slots") {
            const slots = await BookingService.getAvailableSlots(payload.date, payload.providerId);
            return `[Calendar] Available slots for ${payload.date}: ${slots.join(", ")}`;
        } else if (action === "create_booking") {
            const booking = await BookingService.createBooking(payload.details);
            return `[Calendar] Booking Confirmed! ID: ${booking.id}.`;
        } else if (action === "cancel_booking") {
            await BookingService.cancelBooking(payload.bookingId);
            return `[Calendar] Booking ${payload.bookingId} cancelled.`;
        }
        return `[Error] Unknown calendar action: ${action}`;
    } catch (e) {
        return `[Error] Calendar failed: ${e.message}`;
    }
});

ToolRegistry.register("scheduler", async (payload, options) => {
    return ToolRegistry.execute("calendar-api", payload, options);
});


// --- FINTECH TOOLS ---
ToolRegistry.register("create_payment_link", async (payload) => {
    try {
        const result = await CreatePaymentLink(payload);
        if (result.error) return `[Error] Failed to create payment link: ${result.error}`;
        if (result.simulated) return `[System] Payment Link Simulated: ${result.url}`;
        return `[System] Payment Link Created: ${result.url}`;
    } catch (e) {
        return `[Error] Payment link creation failed: ${e.message}`;
    }
});

ToolRegistry.register("payment-gateway", async (payload) => {
    const { action } = payload;
    if (action === "create_link") {
        return ToolRegistry.execute("create_payment_link", payload);
    }
    // ... other legacy actions can be mapped if needed
    return "[Error] Use create_payment_link tool directly.";
});
