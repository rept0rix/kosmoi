/**
 * Entry point for the ESM loader registration.
 * Node.js 18.19+ / 20.6+ / 22+ style:
 *   node --import ./scripts/alias-loader.mjs scripts/agent_worker.js
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register(
    new URL('./alias-hooks.mjs', import.meta.url).href,
    { parentURL: import.meta.url }
);
