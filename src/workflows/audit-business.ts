
import { sleep } from "workflow";
import { fetchBusinessData, analyzeQuality, triggerEnrichment, saveAuditResult, performDeepAudit, performSocialCheck } from "./steps/auditSteps";

export async function auditBusiness(businessId: string) {
    "use workflow";

    // 1. Fetch current business data
    const business = await fetchBusinessData(businessId);

    if (!business) {
        return { status: "error", message: "Business not found" };
    }

    // 2. Analyze Quality Score (Basic)
    let qualityReport = await analyzeQuality(business);

    // 2.5 MCP Deep Audit (HexStrike Integration)
    if (business.website) {
        const deepAudit = await performDeepAudit(business.website);
        if (deepAudit && deepAudit.audit) {
            // Improve score with real data
            qualityReport.score = Math.floor((qualityReport.score + deepAudit.audit.qualityScore) / 2);
            qualityReport.deepAnalysis = deepAudit;

            // Add technical issues to report
            if (deepAudit.audit.issues.length > 0) {
                qualityReport.missing.push(...deepAudit.audit.issues);
            }
        }
    }

    // 2.6 Social Pulse Check
    const socialPlatforms = [
        { key: 'instagram', url: business.metadata?.instagram },
        { key: 'facebook', url: business.metadata?.facebook }
    ];

    for (const p of socialPlatforms) {
        if (p.url) {
            const socialCheck = await performSocialCheck(p.key, p.url);
            if (socialCheck && socialCheck.status === 'active') {
                qualityReport.score += 5; // Bonus for active social
            } else if (socialCheck && socialCheck.status === 'dead_link') {
                qualityReport.missing.push(`Broken ${p.key} link`);
                qualityReport.score -= 5;
            }
        }
    }

    // 3. Decision Logic
    if (qualityReport.score < 50) {
        // Low score? Try to enrich automatically using Google Maps
        if (business.google_place_id && !business.google_reviews) {
            await triggerEnrichment(business.google_place_id);
            // Wait for enrichment to process (it's async on the server/remote)
            await sleep("10s");
            // Re-fetch to see if it improved
            const updatedBusiness = await fetchBusinessData(businessId);
            qualityReport = await analyzeQuality(updatedBusiness); // Recalculate basic

            // Re-run deep audit? (Optional, maybe website changed? unlikely)

            // Save result
            await saveAuditResult(businessId, qualityReport);

            return {
                status: "enriched",
                originalScore: qualityReport.score,
                newScore: qualityReport.score,
                report: qualityReport
            };
        }
    }

    // Save result
    await saveAuditResult(businessId, qualityReport);

    return { status: "completed", score: qualityReport.score, report: qualityReport };
}
