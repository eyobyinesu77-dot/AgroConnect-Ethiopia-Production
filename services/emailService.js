const sendEmailService = async (to, subject, text) => {
  // Nodemailer can be used to send email
  console.log(`Email sent to ${to} with subject: ${subject}`);
};

module.exports = { sendEmailService };