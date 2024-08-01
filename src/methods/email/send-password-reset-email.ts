import { eq } from 'drizzle-orm';
import { db } from '../../db/db';
import { user } from '../../db/schema';
import { generateRandomString } from '../../utils/generate-random-string';
import jwt from 'jsonwebtoken';
import { fromAddress, transporter } from '../../email/transporter';
import ms from 'ms';

const resetPasswordMailBody = (
  email: string,
  displayName: string,
  passwordResetCode: string,
  linkExpiresIn: string,
) => {
  const passwordResetLink = `${
    process.env.FRONTEND_APP_URL
  }/auth/reset-password?email=${encodeURIComponent(
    email,
  )}&code=${passwordResetCode}`;

  const expiresInLong = ms(ms(linkExpiresIn), { long: true });

  return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Reset password</title>

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
                <p style="font-weight: 600">Hello, ${displayName}</p>
                <p>
                    Click on the below link to reset your password for
                    <strong>Hajiganj Crafts.</strong>
                </p>

                <div style="margin-top: 40px">
                    <a
                    href="${passwordResetLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-link"
                    >
                    Reset Password
                    </a>
                </div>

                <p style="margin-top: 40px; font-weight: 600">
                    <i>This link will be valid for ${expiresInLong}</i>
                </p>
            </div>
        </body>
    </html>
    `;
};

export const createAndSendPasswordResetEmail = async (
  email: string,
  displayName: string,
) => {
  // 1. Generate 20 char code
  const passwordResetCode = generateRandomString(20, false);

  // console.log({ passwordResetCode });

  // 2. Generate password reset token
  const passwordResetEmailLinkExpiresIn = '10m';
  const passwordResetToken = jwt.sign(
    {
      email: email,
      passwordResetCode: passwordResetCode,
      sentAt: new Date(),
    },
    process.env.JWT_PASSWORD_RESET_TOKEN_SECRET!,
    {
      expiresIn: passwordResetEmailLinkExpiresIn,
    },
  );

  // 3. Save the password verification code and token in database
  try {
    await db
      .update(user)
      .set({
        passwordResetCode: passwordResetCode,
        passwordResetToken: passwordResetToken,
        updatedAt: new Date(),
      })
      .where(eq(user.email, email));

    // 4. send email contain the url with token
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: '[Hajiganj Crafts] Reset password',
      html: resetPasswordMailBody(
        email,
        displayName,
        passwordResetCode,
        passwordResetEmailLinkExpiresIn,
      ),
    });
  } catch (error) {
    throw new Error(
      '[ send-password.ts ] Failed to send password reset email',
      {
        cause: error,
      },
    );
  }
};
