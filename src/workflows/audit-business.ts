
import { sleep } from "workflow";
import { fetchBusinessData, analyzeQuality, triggerEnrichment } from "./steps/auditSteps";

export async function auditBusiness(businessId: string) {
    "use workflow";

    // 1. Fetch current business data
    const business = await fetchBusinessData(businessId);

    if (!business) {
        return { status: "error", message: "Business not found" };
    }

    // 2. Analyze Quality Score
    const qualityReport = await analyzeQuality(business);

    // 3. Decision Logic
    if (qualityReport.score < 50) {
        // Low score? Try to enrich automatically using Google Maps
        if (business.google_place_id && !business.google_reviews) {
            await triggerEnrichment(business.google_place_id);
            // Wait for enrichment to process (it's async on the server/remote)
            await sleep("10s");
            // Re-fetch to see if it improved
            const updatedBusiness = await fetchBusinessData(businessId);
            const updatedReport = await analyzeQuality(updatedBusiness);
            return {
                status: "enriched",
                originalScore: qualityReport.score,
                newScore: updatedReport.score,
                report: updatedReport
            };
        }
    }

    return { status: "completed", score: qualityReport.score, report: qualityReport };
}
