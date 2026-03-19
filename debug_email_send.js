import nodemailer from 'nodemailer';

async function main() {
  console.log('Starting email debug script...');
  
  const user = 'naor@kosmoi.site';
  const pass = 'kosm0!"'; // Explicitly using the standard quote

  console.log(`Configuring transporter for ${user} with host smtppro.zoho.com...`);

  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    },
    logger: true,
    debug: true,
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  try {
    console.log('Verifying connection configuration...');
    await transporter.verify();
    console.log('Connection verified successfully.');

    console.log('Attempting to send email...');
    const info = await transporter.sendMail({
      from: '"Kosmoi Agent" <naor@kosmoi.site>',
      to: 'yankodesign.co.il@gmail.com',
      subject: 'Kosmoi Agent System Live Test (Debug)',
      text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.',
    });

    console.log('TASK_COMPLETED');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('CRITICAL FAILURE:', error);
  } finally {
    console.log('Script execution finished.');
    process.exit(0);
  }
}

main();