
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { outputFile } from 'fs-extra'; // Assuming accessible or I'll use fs
import { glob } from 'glob';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load Environment Variables
dotenv.config();

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const SRC_DIR = path.resolve(__dirname, '../../src');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY; // Service key preferred for writes if RLS is on
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// IGNORE PATTERNS
const IGNORE_PATTERNS = [
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.js',
    '**/node_modules/**',
    '**/dist/**',
    '**/types/**',
    '**/*.d.ts',
    '**/*.css',
    '**/*.scss',
    '**/*.json', // Maybe include specific JSONs later
    '**/*.svg',
    '**/*.png',
    '**/*.jpg'
];

// Initialize Clients
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Credentials (SUPABASE_URL, SUPABASE_ANON_KEY)");
    process.exit(1);
}
if (!GEMINI_API_KEY) {
    console.error("❌ Missing Gemini API Key");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

/**
 * Generate Embedding for text
 */
async function getEmbedding(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error(`⚠️ Failed to generate embedding: ${error.message}`);
        return null;
    }
}

/**
 * Calculate Checksum
 */
function calculateChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Chunk Code (Naive approach: Function/Class split or Size limit)
 * For simplicity, we'll chunk by lines with overlap, or max chars.
 * Code is distinct from prose; retaining context is key.
 */
function chunkContent(content, filePath, maxChunkSize = 2000) {
    // Basic line-based splitting for now
    // Future: use AST parser for JS/JSX

    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        currentChunk.push(line);
        currentLength += line.length;

        if (currentLength >= maxChunkSize) {
            chunks.push({
                content: currentChunk.join('\n'),
                startLine: i - currentChunk.length + 1,
                endLine: i
            });
            // Overlap: Keep last 5 lines for context
            const overlap = currentChunk.slice(-5);
            currentChunk = [...overlap];
            currentLength = overlap.join('\n').length;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join('\n'),
            startLine: lines.length - currentChunk.length + 1,
            endLine: lines.length
        });
    }

    return chunks;
}

/**
 * Main Indexing Function
 */
async function indexCodebase() {
    console.log(`🚀 Starting Codebase Indexing...`);
    console.log(`📂 Source: ${SRC_DIR}`);

    // 1. Find Files
    const files = await glob('**/*.{js,jsx,ts,tsx}', {
        cwd: SRC_DIR,
        ignore: IGNORE_PATTERNS,
        absolute: true
    });

    console.log(`found ${files.length} files to process.`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const filePath of files) {
        try {
            const relativePath = path.relative(SRC_DIR, filePath);
            const content = fs.readFileSync(filePath, 'utf-8');

            if (!content.trim()) {
                skipped++;
                continue;
            }

            const checksum = calculateChecksum(content);

            // 2. Check if file exists and changed
            const { data: existing, error: fetchError } = await supabase
                .from('code_knowledge')
                .select('checksum, id')
                .eq('path', relativePath)
                .limit(1);

            if (fetchError) {
                console.error(`Error checking DB for ${relativePath}:`, fetchError.message);
                // Continue anyway to try insert
            }

            // Only skip if checksum matches exactly (and we assume chunks correspond 1:1, usually safer to re-index changed files completely)
            // Ideally we'd map all chunks to a file checksum, but here we likely have multiple rows per file.
            // Simplified logic: If ANY row exists with this path and DIFFERENT checksum, we delete all and re-index.
            // If checksum matches, we skip.

            // To do this right:
            // Fetch ONE row for this path.
            if (existing && existing.length > 0) {
                if (existing[0].checksum === checksum) {
                    // console.log(`⏭️  Skipping unchanged: ${relativePath}`);
                    skipped++;
                    continue;
                } else {
                    console.log(`🔄 Updating changed file: ${relativePath}`);
                    // Delete old chunks
                    await supabase.from('code_knowledge').delete().eq('path', relativePath);
                }
            } else {
                console.log(`Hz  New file: ${relativePath}`);
            }

            // 3. Chunk and Embed
            const chunks = chunkContent(content, relativePath);

            for (const chunk of chunks) {
                const embedding = await getEmbedding(chunk.content);
                if (!embedding) continue;

                const { error: insertError } = await supabase
                    .from('code_knowledge')
                    .insert({
                        path: relativePath,
                        content: chunk.content,
                        checksum: checksum,
                        embedding: embedding,
                        metadata: {
                            startLine: chunk.startLine,
                            endLine: chunk.endLine,
                            language: path.extname(filePath).substring(1)
                        }
                    });

                if (insertError) {
                    console.error(`❌ Failed to insert chunk for ${relativePath}:`, insertError.message);
                    errors++;
                }
            }

            processed++;
            // Rate limiting / courtesy delay
            await new Promise(r => setTimeout(r, 200));

        } catch (err) {
            console.error(`❌ Error processing ${filePath}:`, err);
            errors++;
        }
    }

    console.log(`\n✅ Indexing Complete!`);
    console.log(`stats: ${processed} processed, ${skipped} skipped, ${errors} errors.`);
}

// Run
indexCodebase();
