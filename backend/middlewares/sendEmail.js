const nodeMailer = require('nodemailer');
exports.sendEmail = async (options) => {
    var transporter = nodeMailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "11f2f6b82dd819",
          pass: "2f8d3eea4c87b4"
        }
      });
    const mailOptions = {
        from:process.env.SMTP_EMAIL,
        to:options.email,
        subject:options.subject,
        text:options.message
    }
    await transporter.sendMail(mailOptions);
}