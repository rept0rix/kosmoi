import { ToolRegistry } from "../ToolRegistry.js";
import { BookingService } from "../../BookingService.js";
import { PaymentService } from "../../../features/payments/services/PaymentService.js";
import { GenerateImage, CreatePaymentLink } from "../../../api/integrations.js";
import { db } from "../../../api/supabaseClient.js"; // Needed for delegating tasks

// --- CREATIVE TOOLS ---
ToolRegistry.register("generate_image", "Generate a new image using AI based on a text prompt.", { prompt: "string", aspectRatio: "string" }, async (payload) => {
    return await GenerateImage({
        prompt: payload.prompt,
        aspectRatio: payload.aspectRatio
    });
});

ToolRegistry.register("nano_banana_api", "Generate premium images in the Nano Banana Pro style (Gemini 3).", { prompt: "string", style: "string", aspectRatio: "string" }, async (payload) => {
    const prompt = payload.prompt || "luxury abstract design";
    const style = payload.style || "premium cinematic";
    const enhancedPrompt = `${prompt}, ${style}, ultra high quality, professional photography, 8k resolution`;

    console.log(`[Nano Banana Pro] Generating high-quality asset...`);
    const result = await GenerateImage({
        prompt: enhancedPrompt,
        aspectRatio: payload.aspectRatio || "16:9"
    });

    if (result.error) {
        return `[Error] Nano Banana Pro failed: ${result.error}`;
    }

    return `[Nano Banana Pro] Asset generated successfully. URL: ${result.url}`;
});

// --- CALENDAR TOOLS ---
ToolRegistry.register("calendar-api", "Interact with the provider's calendar for availability and bookings.", { action: "string", date: "string", providerId: "string", details: "object" }, async (payload) => {
    const { action } = payload;
    try {
        if (action === "get_slots") {
            const slots = await BookingService.getAvailableSlots(payload.date, payload.providerId);
            return `[Calendar] Available slots for ${payload.date}: ${slots.join(", ")}
[BOOK_NOW:Meeting|${payload.providerId}]`;
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

ToolRegistry.register("scheduler", "Alias for calendar-api. Schedule events.", { action: "string" }, async (payload, options) => {
    return ToolRegistry.execute("calendar-api", payload, options);
});


// --- FINTECH TOOLS ---

// ToolRegistry.register("create_payment_link", async (payload) => {
//     try {
//         const result = await CreatePaymentLink(payload);
//         if (result.error) return `[Error] Failed to create payment link: ${result.error}`;
//         if (result.simulated) return `[System] Payment Link Simulated: ${result.url}`;
//         return `[System] Payment Link Created: ${result.url}`;
//     } catch (e) {
//         return `[Error] Payment link creation failed: ${e.message}`;
//     }
// });


ToolRegistry.register("payment-gateway", "Legacy payment gateway alias.", { action: "string" }, async (payload) => {
    const { action } = payload;
    if (action === "create_link") {
        return ToolRegistry.execute("create_payment_link", payload);
    }
    // ... other legacy actions can be mapped if needed
    return "[Error] Use create_payment_link tool directly.";
});


// --- GITHUB TOOLS (REMOTE DELEGATION) ---
// These tools create a task for the Distributed Worker to execute.
const delegateToWorker = async (toolName, payload) => {
    try {
        const taskData = {
            title: `GitHub Action: ${toolName}`,
            description: JSON.stringify(payload), // Send payload as description for now
            // Or better: store in a 'metadata' field if created, but description works for worker parser
            assigned_to: 'github-specialist-agent',
            status: 'pending',
            priority: 'high',
            created_at: new Date().toISOString()
        };

        // Use the proper "create task" logic if available, or direct DB insert
        // Using direct DB insert for simplicity and speed
        const { data, error } = await db.entities.AgentTasks.create(taskData);

        if (error) throw error;
        return `[System] 🚀 Task Delegated to Distributed Worker!
Type: ${toolName}
Worker: github-specialist-agent
Status: Pending`;
    } catch (e) {
        return `[Error] Failed to delegate task: ${e.message}`;
    }
};

ToolRegistry.register("github_create_issue", "Delegate creating a GitHub issue to a worker.", { title: "string", body: "string" }, async (payload) => delegateToWorker("github_create_issue", payload));
ToolRegistry.register("github_create_pr", "Delegate creating a GitHub PR to a worker.", { title: "string", head: "string", base: "string" }, async (payload) => delegateToWorker("github_create_pr", payload));
ToolRegistry.register("github_list_issues", "Delegate listing GitHub issues to a worker.", { repo: "string" }, async (payload) => delegateToWorker("list_dir", payload));
// Mapping list to list for test, or implement specific list logic in worker
