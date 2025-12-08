import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowsDir = path.join(__dirname, 'src/knowledge/n8n-workflows/workflows');
const outputFile = path.join(__dirname, 'src/knowledge/n8n_catalog.json');

try {
    if (!fs.existsSync(workflowsDir)) {
        console.error(`Directory not found: ${workflowsDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(workflowsDir);
    const catalog = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
            return {
                filename: f,
                path: path.join(workflowsDir, f),
                tags: f.toLowerCase().replace(/[-_.]/g, ' ').split(' ')
            };
        });

    const output = {
        total: catalog.length,
        updated_at: new Date().toISOString(),
        workflows: catalog
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`Successfully indexed ${catalog.length} workflows to ${outputFile}`);
} catch (e) {
    console.error("Failed to index workflows:", e);
}
