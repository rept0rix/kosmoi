const nodemailer = require('nodemailer');

async function sendDirectEmail() {
  console.log('Initializing Direct SMTP Bypass...');
  
  const user = process.env.SMTP_USER || process.env.ZOHO_USER;
  const pass = process.env.SMTP_PASS || process.env.ZOHO_PASS;
  
  if (!user || !pass) {
    console.error('CRITICAL: SMTP Credentials (SMTP_USER/SMTP_PASS) not found in environment.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    }
  });

  try {
    console.log(`Sending from ${user} to yankodesign.co.il@gmail.com...`);
    const info = await transporter.sendMail({
      from: user,
      to: 'yankodesign.co.il@gmail.com',
      subject: 'Kosmoi Agent System Live Test',
      text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live. (Sent via Direct Bypass)'
    });
    console.log('Success! Message ID:', info.messageId);
    console.log('TASK_COMPLETED');
  } catch (error) {
    console.error('Direct Send Failed:', error);
  }
}

sendDirectEmail();