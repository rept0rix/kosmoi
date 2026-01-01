import { ToolRegistry } from "../ToolRegistry.js";
import { db } from "../../../api/supabaseClient.js";

/**
 * Content Creation Tools
 */

// 1. Save Post Draft
ToolRegistry.register(
    "save_post_draft",
    "Save a blog post draft to the CMS.",
    {
        title: "string (Required)",
        content: "string (Markdown format, Required)",
        excerpt: "string (Optional summary)",
        tags: "array of strings (Optional)"
    },
    async (payload, context) => {
        const { title, content, excerpt, tags } = payload;
        const { userId } = context;

        // Generate a simple slug (in production, ensure uniqueness)
        const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);

        const { data, error } = await db.from('blog_posts').insert({
            title,
            slug,
            content,
            excerpt,
            tags,
            status: 'draft',
            author_id: userId
        }).select().single();

        if (error) throw new Error(`Failed to save draft: ${error.message}`);

        return `Draft saved successfully! ID: ${data.id}. You can tell the user the draft is ready for review.`;
    }
);
