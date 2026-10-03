// Real SMTP check against the settings in server/.env (or the environment).
//   npm run verify:email                 -> config summary + real SMTP login (sends nothing)
//   npm run verify:email -- you@gmail.com -> also sends one real test email
// Run it ON THE HOST that runs the API if you want to know whether that
// host can reach Gmail (some hosts block outbound SMTP ports).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sendEmail = require('../utils/sendEmail');
const { getClientUrl } = require('../utils/clientUrl');

(async () => {
  const pass = process.env.SMTP_PASS;
  console.log('NODE_ENV  :', process.env.NODE_ENV || '(unset)');
  console.log('SMTP_HOST :', process.env.SMTP_HOST || 'MISSING');
  console.log('SMTP_PORT :', process.env.SMTP_PORT || '(unset, defaults to 587)');
  console.log('SMTP_USER :', process.env.SMTP_USER || 'MISSING');
  console.log('SMTP_PASS :', pass ? `set (${pass.length} chars)` : 'MISSING');

  try {
    console.log('Reset-link base URL:', getClientUrl());
  } catch (e) {
    console.log('Reset-link base URL: ❌', e.message);
    process.exitCode = 1;
  }

  try {
    await sendEmail.verifyTransport();
    console.log('✅ SMTP connection + login succeeded');
  } catch (e) {
    console.log(`❌ SMTP check failed [${e.code || 'n/a'}]: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const to = process.argv[2];
  if (to) {
    try {
      const info = await sendEmail({
        email: to,
        subject: 'AgroConnect SMTP test',
        message: 'If you can read this, SMTP sending works from this machine.',
      });
      console.log(`✅ Test email accepted by SMTP for ${info.accepted.join(', ')} (messageId ${info.messageId})`);
    } catch (e) {
      console.log(`❌ Test email failed [${e.code || 'n/a'}]: ${e.message}`);
      process.exitCode = 1;
    }
  }
})();
