
import { ToolRegistry } from "../src/services/tools/ToolRegistry.js";

/**
 * WorkflowTools.js
 * Enables agents to discover and read n8n workflow definitions.
 * NOTE: These tools rely on Node.js filesystem access and will likely fail in the browser.
 * They are intended for use by the `agent_worker.js` or backend services.
 */

// Dynamically import node modules to avoid breaking frontend bundlers (Vite)
const loadFs = async () => {
    if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        throw new Error("This tool is only available in a Node.js environment.");
    }
    const fs = await import('fs');
    const path = await import('path');
    return { fs, path };
};

ToolRegistry.register("list_workflows", async (payload = {}) => {
    // payload: { category?: string } (Optional filter by directory)

    try {
        const { fs, path } = await loadFs();
        const WORKFLOWS_DIR = path.resolve(process.cwd(), 'src/knowledge/n8n-workflows/workflows');

        if (!fs.existsSync(WORKFLOWS_DIR)) {
            return `Error: Workflow directory not found at ${WORKFLOWS_DIR}`;
        }

        // Recursive function to find JSON files
        const findJsonFiles = (dir, fileList = []) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    findJsonFiles(filePath, fileList);
                } else {
                    if (path.extname(file).toLowerCase() === '.json') {
                        // Get relative path from WORKFLOWS_DIR
                        const relativePath = path.relative(WORKFLOWS_DIR, filePath);
                        fileList.push(relativePath);
                    }
                }
            });
            return fileList;
        };

        const allWorkflows = findJsonFiles(WORKFLOWS_DIR);

        // Filter if category provided (simple string match on path)
        const result = payload.category
            ? allWorkflows.filter(f => f.includes(payload.category))
            : allWorkflows;

        // Limit results to avoid context overflow if too many
        const LIMITED_RESULT = result.slice(0, 50);
        const warning = result.length > 50 ? `(Showing 50 of ${result.length} workflows)` : "";

        return `Available Workflows ${warning}:\n${LIMITED_RESULT.join('\n')}`;

    } catch (e) {
        return `Error listing workflows: ${e.message}`;
    }
}, "List available n8n workflows. Params: { category?: string }");

ToolRegistry.register("get_workflow", async (payload) => {
    // payload: { name: string } (The filename or relative path)

    try {
        const { fs, path } = await loadFs();
        const workDir = path.resolve(process.cwd(), 'src/knowledge/n8n-workflows/workflows');

        // Safe join?? We trust the agent not to ../../../etc/passwd, but good to check.
        // For now, simple resolve.

        // Allow user to pass "Http/123_Workflow.json" or just "123_Workflow.json" if unique?
        // Let's assume exact relative path as returned by list_workflows OR just filename.

        let targetPath = path.resolve(workDir, payload.name);

        // Standardize: If it doesn't exist, try looking recursively?
        if (!fs.existsSync(targetPath)) {
            // Try to find by filename only
            const allFiles = [];
            const findFiles = (dir) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fp = path.join(dir, file);
                    if (fs.statSync(fp).isDirectory()) findFiles(fp);
                    else if (file === payload.name) allFiles.push(fp);
                }
            };
            findFiles(workDir);

            if (allFiles.length === 1) targetPath = allFiles[0];
            else if (allFiles.length > 1) return `Error: Multiple workflows found with name '${payload.name}'. Please specify the folder.`;
            else return `Error: Workflow not found: ${payload.name}`;
        }

        const content = fs.readFileSync(targetPath, 'utf-8');
        return content;

    } catch (e) {
        return `Error reading workflow: ${e.message}`;
    }
}, "Get content of a specific workflow. Params: { name: 'relative/path/to/workflow.json' }");

console.log("✅ WorkflowTools Registered");
