import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/db';
import { user } from '../../db/schema';
import { generateRandomString } from '../../utils/generate-random-string';
import jwt from 'jsonwebtoken';
import { transporter } from '../../email/transporter';
import ms from 'ms';
import { getEmailVerificationEmailOptions } from './verify-email-options';
import { increment } from '../../utils/db/increment';

export const sendEmailVerificationCode = async (
  email: string,
  displayName: string,
) => {
  // 1. Generate a 6 digit random number
  const emailVerificationCode = generateRandomString(6, true);

  // 1.1 Generate a authentication token for email link verification
  const emailVerificationLinkExpiresIn = '10m';
  const emailVerificationToken = jwt.sign(
    {
      email: email,
      verificationCode: emailVerificationCode,
    },
    process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET!,
    {
      expiresIn: emailVerificationLinkExpiresIn,
    },
  );

  // 2. Save the number in database to check for email verification
  try {
    await db
      .update(user)
      .set({
        verificationCode: emailVerificationCode,
        emailVerificationToken: emailVerificationToken,
        emailVerificationCodeLastSentAt: sql`CURRENT_TIMESTAMP`,
        emailVerificationCodeSentCount: increment(
          user.emailVerificationCodeSentCount,
        ),
        updatedAt: new Date(),
      })
      .where(eq(user.email, email));

    // 3. Send email containing the generated number
    await transporter.sendMail(
      getEmailVerificationEmailOptions({
        email,
        displayName,
        emailVerificationCode,
        emailVerificationToken,
        emailVerificationLinkExpiresIn: ms(ms(emailVerificationLinkExpiresIn), {
          long: true,
        }),
      }),
    );
  } catch (error) {
    console.error('[ error ] send-email-verification-link: ', error);
  }
};
