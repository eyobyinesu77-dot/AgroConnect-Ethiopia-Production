// Plain-text + HTML bodies for the auth emails. Kept simple (inline styles,
// no external assets) since these are transactional emails read in varied
// mail clients, not marketing pages.

const wrap = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1b5e20;">${title}</h2>
    ${bodyHtml}
    <p style="color: #999; font-size: 0.8rem; margin-top: 2rem;">AgroConnect Ethiopia</p>
  </div>
`;

const verificationEmail = (verifyUrl) => ({
  subject: 'Verify your AgroConnect Ethiopia email',
  message: `Welcome to AgroConnect Ethiopia! Please verify your email by opening this link: ${verifyUrl} (expires in 24 hours). If you did not create this account, ignore this email.`,
  html: wrap(
    '✉️ Verify your email',
    `<p style="color:#333;">Welcome to AgroConnect Ethiopia! Please confirm your email address to activate your account.</p>
     <p><a href="${verifyUrl}" style="background:#2e7d32;color:#fff;padding:0.75rem 1.5rem;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">Verify Email</a></p>
     <p style="color:#666;font-size:0.85rem;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>`
  ),
});

const resetPasswordEmail = (resetUrl) => ({
  subject: 'Reset your AgroConnect Ethiopia password',
  message: `We received a request to reset your password. Open this link to choose a new password: ${resetUrl} (expires in 1 hour). If you did not request this, ignore this email — your password will not change.`,
  html: wrap(
    '🔑 Reset your password',
    `<p style="color:#333;">We received a request to reset your AgroConnect Ethiopia password.</p>
     <p><a href="${resetUrl}" style="background:#2e7d32;color:#fff;padding:0.75rem 1.5rem;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a></p>
     <p style="color:#666;font-size:0.85rem;">This link expires in 1 hour. If you did not request this, you can safely ignore this email — your password will not change.</p>`
  ),
});

module.exports = { verificationEmail, resetPasswordEmail };
