const nodemailer = require('nodemailer');

async function sendDirectEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'kosmoi@kosmoi.site',
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: '"Kosmoi Agent" <' + (process.env.SMTP_USER || 'kosmoi@kosmoi.site') + '>',
      to: 'yankodesign.co.il@gmail.com',
      subject: 'Kosmoi Agent System Live Test',
      text: 'This confirms that the Kosmoi Agent system is now connected to the real world via Zoho SMTP. We are live.'
    });

    console.log('TASK_COMPLETED');
    console.log('Message ID: ' + info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendDirectEmail();