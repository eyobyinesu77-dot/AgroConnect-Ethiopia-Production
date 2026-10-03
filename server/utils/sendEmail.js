const nodemailer = require('nodemailer');

// Reads SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS (server/.env.example).
let cachedTransporter = null;

const PLACEHOLDER_RE = /your_app_password|your_password|change_this|^<.*>$/i;

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  if (!isConfigured()) return null;

  // Short timeouts: if the host can't be reached (e.g. the hosting provider
  // blocks outbound SMTP ports) the request fails in seconds with a real
  // error instead of hanging the Forgot Password form for minutes.
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return cachedTransporter;
};

const assertUsable = () => {
  if (!isConfigured()) {
    throw new Error(
      'Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env (or the host\'s environment variables).'
    );
  }
  if (PLACEHOLDER_RE.test(process.env.SMTP_PASS)) {
    throw new Error(
      'SMTP_PASS is still a placeholder. Use a real Gmail App Password (16 characters, requires 2-Step Verification).'
    );
  }
};

// Turns a raw Nodemailer error into a one-line, actionable server log hint.
const hintFor = (err) => {
  if (err.code === 'EAUTH') {
    return 'SMTP login rejected. For Gmail, SMTP_USER must be the account and SMTP_PASS a 16-character App Password, not the normal account password.';
  }
  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED', 'EDNS'].includes(err.code)) {
    return 'Could not reach the SMTP server. Check SMTP_HOST/SMTP_PORT, and note some hosts block outbound SMTP ports 25/465/587 (e.g. Render free web services).';
  }
  return null;
};

// options: { email, subject, message (plain text), html (optional) }
// Resolves with the Nodemailer result ONLY if the SMTP server accepted the
// recipient. Throws on missing/placeholder config, connection/auth errors,
// or a rejected recipient — callers must not report "sent" unless this
// resolves.
const sendEmailOptions = async (options) => {
  assertUsable();
  const transporter = getTransporter();

  const mailOptions = {
    from: `"AgroConnect Ethiopia" <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (err) {
    const hint = hintFor(err);
    if (hint) console.error(`✉️  SMTP hint [${err.code}]: ${hint}`);
    throw err;
  }

  if (!info || !Array.isArray(info.accepted) || info.accepted.length === 0) {
    throw new Error(
      `SMTP server did not accept the recipient (rejected: ${JSON.stringify(info && info.rejected)})`
    );
  }
  return info;
};

// Real SMTP handshake + authentication against SMTP_HOST, without sending
// anything. Used by scripts/verifyEmail.js.
sendEmailOptions.verifyTransport = async () => {
  assertUsable();
  try {
    await getTransporter().verify();
  } catch (err) {
    const hint = hintFor(err);
    if (hint) console.error(`✉️  SMTP hint [${err.code}]: ${hint}`);
    throw err;
  }
};
sendEmailOptions.isConfigured = isConfigured;

module.exports = sendEmailOptions;
