
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function testWorker() {
    console.log("🚀 Starting Distributed Worker Test...");

    // 1. Create a dummy meeting to attach the task to
    console.log("1. Creating test meeting context...");
    const { data: meeting, error: meetingError } = await supabase
        .from('board_meetings')
        .insert([{
            title: 'Worker Connection Test',
            status: 'active'
        }])
        .select()
        .single();

    if (meetingError) {
        console.error("❌ Failed to create meeting:", meetingError.message);
        process.exit(1);
    }
    console.log("✅ Meeting created:", meeting.id);

    // 2. Create the task
    console.log("2. Creating task for 'tech-lead-agent'...");
    const taskPayload = {
        title: 'Distributed Hello World',
        description: 'execute_command: echo "Hello from Machine 2" && uptime',
        assigned_to: 'tech-lead-agent',
        status: 'pending',
        priority: 'high',
        meeting_id: meeting.id
    };

    const { data: task, error: taskError } = await supabase
        .from('agent_tasks')
        .insert([taskPayload])
        .select()
        .single();

    if (taskError) {
        console.error("❌ Failed to create task:", taskError.message);
        process.exit(1);
    }
    console.log(`✅ Task created [${task.id}]. Waiting for worker to pick it up...`);

    // 3. Poll for completion
    let attempts = 0;
    while (attempts < 30) { // 30 attempts * 2s = 60s timeout
        attempts++;
        const { data: updatedTask, error: pollError } = await supabase
            .from('agent_tasks')
            .select('*')
            .eq('id', task.id)
            .single();

        if (pollError) {
            console.error("Error polling task:", pollError.message);
        } else {
            console.log(`   [${attempts}/30] Status: ${updatedTask.status}`);

            if (updatedTask.status === 'in_progress') {
                console.log("   🚀 Worker picked up the task! (Status: in_progress)");
            }

            if (updatedTask.status === 'done' || updatedTask.status === 'completed') {
                console.log("🎉 SUCCESS! Task completed.");
                console.log("📝 Result from Worker:", updatedTask.result);
                process.exit(0);
            }

            if (updatedTask.status === 'failed') {
                console.error("❌ Task FAILED by worker.");
                console.error("Reason:", updatedTask.result);
                process.exit(1);
            }
        }

        await new Promise(r => setTimeout(r, 2000));
    }

    console.error("❌ Timeout waiting for worker response.");
    process.exit(1);
}

testWorker();
