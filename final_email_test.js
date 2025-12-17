import nodemailer from 'nodemailer';

async function main() {
  const user = 'naor@kosmoi.site';
  const pass = 'kosm0!"'; // Explicitly using standard double quote

  console.log(`Configuring transporter for ${user}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    }
  });

  try {
    console.log('Sending email...');
    const info = await transporter.sendMail({
      from: '"Kosmoi Agent" <naor@kosmoi.site>',
      to: 'yankodesign.co.il@gmail.com',
      subject: 'Kosmoi Agent System Live Test',
      text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.',
    });
    console.log('TASK_COMPLETED');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('FINAL EMAIL TEST FAILED:', error.message);
  }
}

main();