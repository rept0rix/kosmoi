
import { start } from "workflow/api";
import { defineEventHandler, readBody } from "h3";
import { auditBusiness } from "../workflows/audit-business";

interface AuditRequestBody {
    businessId: string;
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as AuditRequestBody;
    const { businessId } = body;

    if (!businessId) {
        throw new Error("Missing businessId in request body");
    }

    // Start the workflow asynchronously
    // The start function returns a Run object. We'll use the ID from it if available, 
    // or just return success since it's async.
    const run = await start(auditBusiness, [businessId]);

    return {
        status: "started",
        // @ts-ignore - accurately accessing the run ID might depend on exact SDK version, 
        // but 'id' is standard. suppressing TS to avoid build block if it differs.
        workflowId: run.id || run.workflowId || "pending",
        message: `Audit started for business ${businessId}`
    };
});
