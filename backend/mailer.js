// Mailer utility: sends emails via nodemailer or logs them locally if SMTP env vars are absent
const nodemailer = require('nodemailer');

// Send email helper
async function sendMail({ to, subject, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  // If SMTP configuration is missing, log the email to the console (great for local dev/testing)
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('\n========================================');
    console.log('[LOCAL MAILER - SMTP not configured]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:`);
    console.log(text);
    console.log('========================================\n');
    return { mocked: true };
  }

  // Create transporter using configured SMTP credentials
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for port 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const mailOptions = {
    from: MAIL_FROM || `"DCRUST Placement Portal" <${SMTP_USER}>`,
    to,
    subject,
    text
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}: ${info.messageId}`);
  return info;
}

module.exports = { sendMail };
