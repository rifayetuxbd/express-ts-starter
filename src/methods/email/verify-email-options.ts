import { SendMailOptions } from 'nodemailer';
import { EmailVerificationData } from '../../types/email-verification';
import { fromAddress } from '../../email/transporter';

export const getEmailVerificationEmailOptions = (
  data: EmailVerificationData,
) => {
  const verificationLink = `${process.env
    .FRONTEND_APP_URL!}/auth/verify-email?email=${encodeURIComponent(
    data.email,
  )}&verificationCode=${data.emailVerificationCode}`;

  const mailOptions: SendMailOptions = {
    // from: `'Rifayet Dev' <${process.env.NODE_MAILER_EMAIL!}>`,
    from: fromAddress,
    // sender: '"Sender name" <no-reply@hajiganj-crafts.com>',
    to: data.email,
    subject: '[Hajiganj Crafts] Verify your email',
    html: `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Email</title>

    <style>
      body {
        margin: 0;
        padding: 10px;
        font-size: 16px;
      }

      .btn-link {
        background-color: rgb(11, 166, 122);
        color: white;
        padding: 10px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-size: 20px;
      }
    </style>
  </head>
  <body>
    <div>
      <p style="font-weight: 600">Hello, ${data.displayName}</p>
      <p>
        Thank you for registering your account with
        <strong>Hajiganj Crafts</strong>
      </p>
      <p>
        Your verification Code is:
        <strong>${data.emailVerificationCode}</strong>
      </p>

      <div style="margin-top: 40px">
        <a
          href="${verificationLink}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-link"
        >
          Click Here to Verify
        </a>
      </div>

      <p style="margin-top: 40px; font-weight: 600">
        <i
          >This link will be valid for ${data.emailVerificationLinkExpiresIn}</i
        >
      </p>
    </div>
  </body>
</html>
    `,
  };

  return mailOptions;
};
