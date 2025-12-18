import 'fake-indexeddb/auto';
import { getDatabase } from '../src/services/rxdb/config.js';

async function testRxDB() {
    try {
        console.log("🛠️ Testing RxDB Initialization...");
        const db = await getDatabase();

        console.log("📝 Inserting Test Task...");
        const task = await db.tasks.insert({
            id: 'task-' + Date.now(),
            title: 'Test Task RxDB',
            status: 'pending',
            description: 'This is a test task inserted via checking script',
            assigned_to: 'agent-007',
            priority: 'low',
            created_at: new Date().toISOString()
        });

        console.log("✅ Task Inserted:", task.toJSON());

        console.log("🔍 Querying Tasks...");
        const tasks = await db.tasks.find().exec();
        console.log(`✅ Found ${tasks.length} tasks in local DB.`);

        console.log("🎉 RxDB Test Passed!");
    } catch (e) {
        console.error("❌ RxDB Test Failed:", e);
        process.exit(1);
    }
}

testRxDB();
