/**
 * Node.js ESM loader hooks to resolve Vite's @/ path alias.
 * Used via: node --import ./scripts/alias-loader.mjs scripts/agent_worker.js
 * Resolves @/ → src/ with automatic .js extension resolution.
 */
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, '../src');

function resolveAlias(specifier) {
    if (!specifier.startsWith('@/')) return null;

    const relative = specifier.slice(2); // remove '@/'
    const base = path.resolve(srcRoot, relative);

    // Try exact path first
    if (fs.existsSync(base)) return base;

    // Try with .js extension
    if (fs.existsSync(base + '.js')) return base + '.js';

    // Try index.js
    const indexPath = path.join(base, 'index.js');
    if (fs.existsSync(indexPath)) return indexPath;

    // Try .jsx
    if (fs.existsSync(base + '.jsx')) return base + '.jsx';

    return null;
}

export async function resolve(specifier, context, nextResolve) {
    const resolved = resolveAlias(specifier);
    if (resolved) {
        return nextResolve(pathToFileURL(resolved).href, context);
    }
    return nextResolve(specifier, context);
}
