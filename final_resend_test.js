const apiKey = 're_37TKVjL5_5i3rNwstuWYJAuEBLJLkwLiV'; // Retrieved from .env analysis

async function sendEmail() {
    console.log('🚀 Initiating Resend API transmission...');
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: 'yankodesign.co.il@gmail.com',
                subject: 'Kosmoi Agent System Live Test',
                html: '<p>This confirms that the Kosmoi Agent system is now connected to the real world via Resend API. We are live.</p>'
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('❌ Resend Error:', JSON.stringify(data, null, 2));
        } else {
            console.log('✅ TASK_COMPLETED');
            console.log('Message ID:', data.id);
        }
    } catch (error) {
        console.error('❌ Network/Script Error:', error);
    }
}

sendEmail();