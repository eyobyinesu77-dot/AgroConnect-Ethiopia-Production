const nodemailer = require('nodemailer');

let transporter = null;

const getConfig = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    throw new Error(
      'Email is not configured. Set SMTP_USER and SMTP_PASS in the server environment.'
    );
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port.');
  }

  return { host, port, user, pass, from };
};

const getTransporter = () => {
  if (transporter) return transporter;

  const { host, port, user, pass } = getConfig();

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
};

const sendEmailOptions = async (options) => {
  if (!options || !options.email || !options.subject) {
    throw new Error('Email recipient and subject are required.');
  }

  const { from } = getConfig();

  try {
    const info = await getTransporter().sendMail({
      from,
      to: options.email,
      subject: options.subject,
      text: options.message || '',
      ...(options.html ? { html: options.html } : {}),
    });

    console.log(`Email accepted by SMTP for ${options.email}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Failed to send email via SMTP:', err.message);
    throw err;
  }
};

sendEmailOptions.verifyTransport = async () => {
  getConfig();
  return getTransporter().verify();
};

sendEmailOptions.isConfigured = () => {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
};

module.exports = sendEmailOptions;
