require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

const sendEmail = require('../utils/sendEmail');
const { getClientUrl } = require('../utils/clientUrl');

(async () => {
  console.log('NODE_ENV  :', process.env.NODE_ENV || '(unset)');
  console.log('SMTP_HOST :', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('SMTP_PORT :', process.env.SMTP_PORT || '587');
  console.log(
    'SMTP_USER :',
    process.env.SMTP_USER || process.env.EMAIL_USER ? '[SET]' : 'MISSING'
  );
  console.log(
    'SMTP_PASS :',
    process.env.SMTP_PASS || process.env.EMAIL_PASS ? '[SET]' : 'MISSING'
  );

  try {
    console.log('Reset-link base URL:', getClientUrl());
    await sendEmail.verifyTransport();
    console.log('SMTP connection and authentication succeeded.');
  } catch (err) {
    console.error(`SMTP check failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const recipient = process.argv[2];
  if (recipient) {
    try {
      const info = await sendEmail({
        email: recipient,
        subject: 'AgroConnect SMTP test',
        message: 'This is a test email from AgroConnect.',
      });
      console.log('Test email accepted. Message ID:', info.messageId);
    } catch (err) {
      console.error(`Test email failed: ${err.message}`);
      process.exitCode = 1;
    }
  }
})();
