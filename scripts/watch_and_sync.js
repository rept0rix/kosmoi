import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkAndPull() {
    try {
        // Fetch updates from origin
        await execAsync('git fetch origin');

        // Check if we are behind
        const { stdout: status } = await execAsync('git status -uno');

        if (status.includes('Your branch is behind')) {
            console.log('⬇️ Updates detected from Remote Worker. Pulling...');
            const { stdout: pullOutput } = await execAsync('git pull');
            console.log('✅ Changes applied:', pullOutput);
        } else {
            // console.log('✨ Up to date.');
        }
    } catch (error) {
        console.error('❌ Sync Error:', error.message);
    }
}

console.log('🔄 Auto-Sync Started. Watching for work done by AI Partner...');
setInterval(checkAndPull, 10000); // Check every 10 seconds
checkAndPull(); // Initial check
