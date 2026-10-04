const { Resend } = require('resend');

let resendClient = null;

const isConfigured = () =>
  Boolean(process.env.RESEND_API_KEY);

const getResend = () => {
  if (resendClient) return resendClient;

  if (!isConfigured()) return null;

  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

// options: { email, subject, message (plain text), html (optional) }
const sendEmailOptions = async (options) => {
  if (!isConfigured()) {
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY in the server environment.'
    );
  }

  const resend = getResend();

  try {
    const { data, error } = await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        'AgroConnect Ethiopia <onboarding@resend.dev>',
      to: [options.email],
      subject: options.subject,
      text: options.message,
      html: options.html,
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    if (!data || !data.id) {
      throw new Error('Resend did not return an email ID');
    }

    console.log(`✉️ Email sent successfully via Resend: ${data.id}`);
    return data;
  } catch (err) {
    console.error('❌ Failed to send email via Resend:', err);
    throw err;
  }
};

// Kept for compatibility with existing verification scripts.
sendEmailOptions.verifyTransport = async () => {
  if (!isConfigured()) {
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY in the server environment.'
    );
  }

  return true;
};

sendEmailOptions.isConfigured = isConfigured;

module.exports = sendEmailOptions;
