
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasks() {
    console.log('Checking recent agent tasks...');
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('id, title, description, assigned_to, status, result, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No tasks found.');
    } else {
        data.forEach(task => {
            console.log(`\n--- Task ID: ${task.id} ---`);
            console.log(`Title: ${task.title}`);
            console.log(`Assigned To: ${task.assigned_to}`);
            console.log(`Status: ${task.status}`);
            console.log(`Created At: ${new Date(task.created_at).toLocaleString()}`);
            console.log(`Description: ${task.description ? task.description.substring(0, 100) + '...' : 'N/A'}`);
            if (task.result) console.log(`Result: ${task.result.substring(0, 200)}...`);
            if (task.error) console.log(`Error: ${JSON.stringify(task.error)}`);
        });
    }

    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No tasks found.');
    } else {
        data.forEach(task => {
            console.log(`\n--- Task ID: ${task.id} ---`);
            console.log(`Role: ${task.role}`);
            console.log(`Command: ${task.command}`);
            console.log(`Status: ${task.status}`);
            console.log(`Created At: ${new Date(task.created_at).toLocaleString()}`);
            if (task.error) console.log(`Error: ${JSON.stringify(task.error)}`);
            if (task.result) console.log(`Result: ${JSON.stringify(task.result).substring(0, 200)}...`);
        });
    }
}

checkTasks();
