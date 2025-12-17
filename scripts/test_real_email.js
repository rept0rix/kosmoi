
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function triggerTestEmail() {
    const targetEmail = 'yankodesign.co.il@gmail.com'; // Fixed typo from 'gmaiil.com'
    console.log(`📧 Triggering Real Email Test to: ${targetEmail}`);

    const taskDesc = `Send a REAL test email to ${targetEmail} using the 'send_email' tool. ` +
        `Subject: 'Kosmoi Agent System Live Test'. ` +
        `Body: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.'. ` +
        `Reply with 'TASK_COMPLETED' and the Message ID.`;

    const { data: task, error } = await supabase.from('agent_tasks').insert([{
        title: `System Test: Real Email`,
        description: taskDesc,
        assigned_to: 'sales-pitch', // or tech-lead
        status: 'pending',
        priority: 'critical'
    }]).select().single();

    if (error) {
        console.error("Failed to create task:", error.message);
        return;
    }

    console.log(`✅ Task Created: ${task.id}. Waiting for worker to pick it up...`);

    // Poll
    let turns = 0;
    while (turns < 45) {
        const { data } = await supabase.from('agent_tasks').select('status, result').eq('id', task.id).single();
        if (data.status === 'done') {
            console.log(`🎉 Task Finished! Result: ${data.result}`);
            return;
        }
        await new Promise(r => setTimeout(r, 4000));
        process.stdout.write('.');
        turns++;
    }
}

triggerTestEmail();
