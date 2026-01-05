import { IMCPTool, MCPToolDefinition, MCPToolRequest, MCPToolResponse } from "../types";
import * as cheerio from 'cheerio';

export class WebsiteHealthTool implements IMCPTool {
    definition: MCPToolDefinition = {
        name: "website_audit",
        description: "Audits a website for basic health, SEO meta tags, and performance indicators.",
        version: "1.0.0",
        parameters: {
            url: {
                type: "string",
                description: "The URL of the website to audit",
                required: true
            }
        }
    };

    async execute(args: Record<string, any>): Promise<MCPToolResponse> {
        const targetUrl = args.url;
        if (!targetUrl) {
            return { success: false, result: null, error: "Missing 'url' parameter" };
        }

        try {
            const startTime = performance.now();

            // 1. Connectivity & SSL Check
            let response;
            try {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

                response = await fetch(targetUrl, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Kosmoi-Audit-Bot/1.0'
                    }
                });
                clearTimeout(id);
            } catch (netErr) {
                return {
                    success: true, // Tool ran successfully, but site is down
                    result: {
                        status: 'down',
                        error: (netErr as Error).message,
                        details: "Could not connect to website"
                    }
                };
            }

            const loadTime = Math.round(performance.now() - startTime);
            const html = await response.text();

            // 2. SEO Parsing
            const $ = cheerio.load(html);
            const title = $('title').text().trim();
            const description = $('meta[name="description"]').attr('content') || "";
            const h1Count = $('h1').length;
            const images = $('img').length;
            const imagesWithoutAlt = $('img:not([alt])').length;

            // 3. Security Checks
            const isSsl = targetUrl.startsWith('https');

            // 4. Score Calculation (Simplified)
            let score = 100;
            const issues: string[] = [];

            if (!isSsl) { score -= 20; issues.push("Not using HTTPS"); }
            if (loadTime > 2000) { score -= 10; issues.push("High load time (>2s)"); }
            if (h1Count === 0) { score -= 10; issues.push("Missing H1 tag"); }
            if (h1Count > 1) { score -= 5; issues.push("Multiple H1 tags"); }
            if (!description) { score -= 10; issues.push("Missing Meta Description"); }
            if (imagesWithoutAlt > 0) { score -= 5; issues.push(`Found ${imagesWithoutAlt} images without ALT text`); }

            return {
                success: true,
                result: {
                    status: 'online',
                    statusCode: response.status,
                    loadTimeMs: loadTime,
                    ssl: isSsl,
                    seo: {
                        title: title.substring(0, 100),
                        descriptionLength: description.length,
                        h1Count: h1Count,
                        h1Sample: $('h1').first().text().trim().substring(0, 50)
                    },
                    audit: {
                        qualityScore: Math.max(0, score),
                        issues: issues
                    }
                }
            };

        } catch (error) {
            return {
                success: false,
                result: null,
                error: (error as Error).message
            };
        }
    }
}
