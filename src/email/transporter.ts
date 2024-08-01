import { createTransport } from 'nodemailer';

/**
 * __Transporter example usage__
 * ```ts
 * const mailOptions: SendMailOptions = {
 *    from: '"Rifayet Dev" <rifayetdev@gmail.com>', // Sender address
 *    to: 'rifayetoffice@gmail.com',
 *    subject: 'Using secure port 465',
 *    text: 'Your email content in plain text',
 *    // For HTML content, use the following instead of 'text'
 *    // html: 'Your email content in HTML format'
 * };
 *
 * transporter.sendMail(mailOptions).then().catch()
 * ```
 */
export const transporter = createTransport({
  // service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use `true` for port 465, `false` for all other ports (Eg: 587)
  auth: {
    user: process.env.NODE_MAILER_EMAIL!,
    pass: process.env.NODE_MAILER_EMAIL_PASSWORD!,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const fromAddress = {
  name: process.env.NODE_MAILER_EMAIL_FROM!,
  address: process.env.NODE_MAILER_EMAIL_ADDRESS!,
};
