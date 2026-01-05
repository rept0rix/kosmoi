
import { start } from "workflow/api";
import { defineEventHandler, readBody } from "nitro/h3";
import { auditBusiness } from "../workflows/audit-business";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { businessId } = body;

    if (!businessId) {
        throw new Error("Missing businessId in request body");
    }

    // Start the workflow asynchronously
    const { workflowId } = await start(auditBusiness, [businessId]);

    return {
        status: "started",
        workflowId,
        message: `Audit started for business ${businessId}`
    };
});
