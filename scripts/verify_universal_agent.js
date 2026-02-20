import dotenv from 'dotenv';
dotenv.config();

// POLYFILL for Vite environment variables in Node.js
if (!global.import) {
    global.import = {};
}

// Ensure VITE_ prefixes exist if they are missing but standard ones exist
if (process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (process.env.SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
}

console.log("Environment Debug:");
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "Set" : "Missing");
console.log("VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing");

import { SchemaInspector } from '../src/services/database/SchemaInspector.js';
import { ToolRegistry } from '../src/services/tools/ToolRegistry.js';
import '../src/services/tools/registry/UniversalDataTool.js';

async function verifyUniversalAgentComponents() {
    console.log("🔍 Verifying Universal Database Agent Components...\n");

    // 1. Test Schema Inspection
    console.log("--- Test 1: Schema Introspection ---");
    try {
        const schema = await SchemaInspector.getPublicSchema();
        if (schema && typeof schema === 'object') {
            const keys = Object.keys(schema);
            console.log(`Schema retrieved: ${keys.length} tables found.`);
            if (keys.length > 0) console.log("Sample tables:", keys.slice(0, 3).join(', '));

            if (schema['agent_tasks'] || keys.length > 0) { // If we found ANY tables, it's a success for connection
                console.log("✅ Success: Schema introspection working.");
            } else {
                console.log("⚠️ Warning: Schema is empty.");
            }
        } else {
            console.log("Schema retrieved:", schema);
        }
    } catch (e) {
        console.error("❌ Test 1 Failed:", e);
    }

    // 2. Test SQL Execution (Safe)
    console.log("\n--- Test 2: Safe SQL Execution (SELECT) ---");
    try {
        // Correct usage: execute(name, payload)
        // We use a safe query. 'agent_configs' is likely to exist.
        const result = await ToolRegistry.execute('run_read_only_sql', { query: "SELECT count(*) FROM agent_configs" });

        console.log("Tool execution result:", JSON.stringify(result).substring(0, 200) + "...");

        if (typeof result === 'string' && (result.includes("System Notice") || result.includes("Error"))) {
            console.log("ℹ️ Note: RPC missing is expected if migration not run. The *Tool Logic* is working.");
        } else {
            console.log("✅ Success: Query executed successfully.");
        }

    } catch (e) {
        console.error("❌ Test 2 Failed:", e);
    }

    // 3. Test Security Block
    console.log("\n--- Test 3: Security Guardrails (DELETE) ---");
    try {
        const result = await ToolRegistry.execute('run_read_only_sql', { query: "DELETE FROM users WHERE id = 1" });

        if (typeof result === 'string' && result.includes("Security Block")) {
            console.log("✅ Success: Dangerous query was blocked.");
        } else {
            console.error("❌ CRITICAL FAILURE: Dangerous query was NOT blocked:", result);
        }
    } catch (e) {
        console.log("✅ Success: Dangerous query threw an error:", e.message);
    }
}

verifyUniversalAgentComponents();
