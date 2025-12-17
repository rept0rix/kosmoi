const apiKey = 're_37TKVjL5_5i3rNwstuWYJAuEBLJLkwLiV'; // From .env

async function main() {
  console.log('Attempting to send email via Resend...');
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['yankodesign.co.il@gmail.com'],
        subject: 'Kosmoi Agent System Live Test',
        html: '<p>This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.</p>'
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log('TASK_COMPLETED');
    console.log('Message ID:', data.id);
  } catch (error) {
    console.error('EMAIL FAILED:', error.message);
  }
}

main();