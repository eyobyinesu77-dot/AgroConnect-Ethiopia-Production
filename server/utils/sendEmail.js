const nodemailer = require('nodemailer');

// The project's env convention is SMTP_HOST / SMTP_PORT / SMTP_USER /
// SMTP_PASS (see server/.env.example and server/.env) — this previously
// read EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS instead, which are
// never set anywhere in the project, so createTransport() silently got
// undefined host/auth and any real send would fail. Fixed to match the
// actual configured variable names.
const sendEmailOptions = async (options) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in server/.env.'
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465 (implicit TLS), false for 587/others (STARTTLS)
    auth: { user, pass },
  });

  const mailOptions = {
    from: `"AgroConnect Ethiopia" <${user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Let this throw on failure — callers decide how to handle a failed send
  // (e.g. rolling back a stored reset token). Never swallow the error here.
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmailOptions;