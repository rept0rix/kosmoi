import nodemailer from 'nodemailer';

async function main() {
  // Using credentials found in .env
  const user = 'naor@kosmoi.site';
  // The password appeared with Hebrew/Special quotes in .env, using exact string found inside the outer quotes
  const pass = 'kosm0!״'; 

  console.log(`Attempting connection to Zoho SMTP for ${user}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: user,
      pass: pass
    }
  });

  try {
    const info = await transporter.sendMail({
      from: '"Kosmoi Agent" <naor@kosmoi.site>',
      to: 'yankodesign.co.il@gmail.com',
      subject: 'Kosmoi Agent System Live Test',
      text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.',
    });
    console.log('TASK_COMPLETED');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('EMAIL FAILED:', error.message);
    // Fallback: Check if it's a quoting issue, maybe the password ends with a normal quote
    if (error.code === 'EAUTH' || error.responseCode === 535) {
        console.log('Retrying with alternative password format (replacing Hebrew quote with standard quote)...');
        try {
             const altPass = 'kosm0!"';
             transporter.options.auth.pass = altPass;
             // Re-create transporter to ensure auth update
             const transporter2 = nodemailer.createTransport({
                host: 'smtppro.zoho.com',
                port: 465,
                secure: true,
                auth: {
                  user: user,
                  pass: altPass
                }
             });
             
             const info2 = await transporter2.sendMail({
                from: '"Kosmoi Agent" <naor@kosmoi.site>',
                to: 'yankodesign.co.il@gmail.com',
                subject: 'Kosmoi Agent System Live Test',
                text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.',
             });
             console.log('TASK_COMPLETED');
             console.log('Message ID:', info2.messageId);
        } catch(err2) {
            console.error('EMAIL FAILED AGAIN:', err2.message);
        }
    }
  }
}

main();