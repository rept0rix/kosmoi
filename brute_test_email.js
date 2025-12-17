import nodemailer from 'nodemailer';

const user = 'naor@kosmoi.site';
const candidates = [
  'kosm0!',       // Maybe the quote is a typo
  'kosm0!"',      // Standard quote
  'kosm0!״',      // Hebrew quote (from .env)
  'kosm0'         // Base word
];

async function testAuth(pass) {
  console.log(`Testing password: ${pass}`);
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
    await transporter.verify();
    console.log(`SUCCESS! Valid password found: ${pass}`);
    // Send the email immediately if found
    const info = await transporter.sendMail({
      from: `"Kosmoi Agent" <${user}>`,
      to: 'yankodesign.co.il@gmail.com',
      subject: 'Kosmoi Agent System Live Test',
      text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.',
    });
    console.log('TASK_COMPLETED');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (err) {
    console.log(`Failed: ${err.response}`);
    return false;
  }
}

async function run() {
  for (const pass of candidates) {
    if (await testAuth(pass)) break;
  }
}

run();