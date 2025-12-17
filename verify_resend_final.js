import { SendEmail } from './src/api/integrations.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Launching final Resend verification...');
    
    // explicit target required by Resend sandbox
    const target = 'na0ryank0@gmail.com'; 
    
    try {
        const result = await SendEmail({
            to: target,
            subject: 'Kosmoi Agent System: Link Established',
            html: '<h1>We are live.</h1><p>The sales machinery is now operational via Resend.</p>'
        });
        
        if (result.error) {
             console.error('❌ Transmission Failed:', result.error);
        } else {
             console.log('✅ TASK_COMPLETED');
             console.log('Proof of Delivery:', result);
        }
    } catch (err) {
        console.error('❌ Fatal Error:', err);
    }
}

main();