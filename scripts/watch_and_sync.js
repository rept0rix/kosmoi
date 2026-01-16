import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const PULL_INTERVAL = 10000; // 10 seconds
const PUSH_DEBOUNCE = 5000;  // 5 seconds
const IGNORED_DIRS = ['.git', 'node_modules', 'dist', '.gemini', '.DS_Store'];

let isPushing = false;
let pushTimer = null;

console.log('🔄 Auto-Sync Agent v2.0 Started (Bidirectional)');

// 1. Inbound Sync (Pull)
setInterval(async () => {
    if (isPushing) return;
    try {
        await execAsync('git fetch origin');
        const { stdout } = await execAsync('git status -uno');
        if (stdout.includes('Your branch is behind')) {
            console.log('⬇️ Remote changes detected. Pulling...');
            const { stdout: pullLog } = await execAsync('git pull');
            console.log('✅ Pulled:', pullLog.trim());
        }
    } catch (err) {
        // console.warn('⚠️ Pull check failed:', err.message);
    }
}, PULL_INTERVAL);

// 2. Outbound Sync (Push)
function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);

    pushTimer = setTimeout(async () => {
        isPushing = true;
        console.log('⬆️ Local changes stable. Pushing to remote...');

        try {
            await execAsync('git add .');
            // Check if anything to commit
            const { stdout: status } = await execAsync('git status --porcelain');
            if (status.trim()) {
                await execAsync('git commit -m "chore(auto-sync): Agent detected local changes"');
                await execAsync('git push');
                console.log('✅ Pushed local changes to remote.');
            } else {
                console.log('ℹ️ No changes to commit.');
            }
        } catch (err) {
            console.error('❌ Push failed:', err.message);
        } finally {
            isPushing = false;
        }
    }, PUSH_DEBOUNCE);
}

// Watcher
try {
    fs.watch('.', { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (IGNORED_DIRS.some(d => filename.startsWith(d))) return;

        // Console log only on first debounce trigger to avoid spam
        if (!pushTimer) console.log(`👀 Change detected in ${filename}... scheduling push.`);
        schedulePush();
    });
    console.log('✅ Watching for file changes...');
} catch (error) {
    console.error('❌ Watcher failed:', error.message);
}
