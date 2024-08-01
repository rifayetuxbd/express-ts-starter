import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import ms from 'ms';
import { sendEmailVerificationCode } from '../../methods/email/send-email-verification-link';

const resendEmailVerificationCodeSchema = z.object({
  email: z.string().email('Required valid email').trim(),
});

type ResendEmailVerificationCodePostData = z.infer<
  typeof resendEmailVerificationCodeSchema
>;

export const validateResendEmailVerificationCodePostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    email: req.body.email,
  };

  const validatedInput = await resendEmailVerificationCodeSchema.safeParseAsync(
    input,
  );

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid email',
      messageCode: 'auth/invalid-email',
      stackTrace: new Error(
        '[ resend-email-verification-code.middleware ] zod schema failed',
      ),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.resendEmailVerificationLinkPostData = validatedInput.data;

  return next();
};

export const resendEmailVerificationLink = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body
    .resendEmailVerificationLinkPostData as ResendEmailVerificationCodePostData;

  try {
    const userData = await db.query.user.findFirst({
      columns: {
        displayName: true,
        emailVerified: true,
        emailVerificationCodeLastSentAt: true,
        emailVerificationCodeSentCount: true,
      },
      where: (users, { eq }) => eq(users.email, email),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid email address',
        messageCode: 'auth/invalid-email',
        stackTrace: new Error(
          '[ resend-email-verification-code.middleware ] no user data found for the email address',
        ),
      };

      return next(nextError);
    }
    //
    if (userData.emailVerified === true) {
      const nextError: NextError = {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Email is already verified',
        messageCode: 'auth/email-verified',
        stackTrace: new Error(
          '[ resend-email-verification-code.middleware ] user email is already verified',
        ),
      };

      return next(nextError);
    }
    //
    if (userData.emailVerificationCodeLastSentAt !== null) {
      /**
       * Allow email resent in three minutes interval
       */

      let resendTime = '3m';
      let resendMessage = '';
      if (userData.emailVerificationCodeSentCount !== null) {
        if (userData.emailVerificationCodeSentCount >= 10) {
          resendTime = '10m';
          resendMessage = 'Many requests. ';
        } else if (userData.emailVerificationCodeSentCount >= 15) {
          resendTime = '20m';
          resendMessage = 'Many requests. ';
        } else if (userData.emailVerificationCodeSentCount >= 20) {
          resendTime = '5h';
          resendMessage = 'Too many requests. ';
        } else if (userData.emailVerificationCodeSentCount >= 30) {
          resendTime = '1d';
          resendMessage = 'Too many requests. ';
        } else if (userData.emailVerificationCodeSentCount >= 40) {
          resendTime = '10d';
          resendMessage = 'Too many requests. Contact Admin. ';
        }
      }

      // console.log({
      //   resendTime,
      //   resendMessage,
      //   count: userData.emailVerificationCodeSentCount,
      // });

      const resendCodeTimeout = ms(resendTime); // 3 minutes
      const timeDifference =
        new Date().getTime() -
        userData.emailVerificationCodeLastSentAt.getTime();

      // console.log({ timeDifference, resentCodeTimeout: resendCodeTimeout });

      if (timeDifference <= resendCodeTimeout) {
        const nextError: NextError = {
          statusCode: StatusCodes.BAD_REQUEST,
          message: `${resendMessage}You can resend email again after ${ms(
            resendCodeTimeout - timeDifference,
            {
              long: true,
            },
          )}`,
          messageCode: 'auth/resend-failed',
          stackTrace: new Error(
            '[ resend-email-verification-code.middleware ] Next link requires 3 minutes interval',
          ),
        };

        return next(nextError);
      }
    }

    await sendEmailVerificationCode(email, userData.displayName || '');

    res.status(StatusCodes.OK).send({
      message: 'We have resent another verification code to your email',
    });
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error(
        '[ resend-email-verification-code.middleware.middleware ] Internal server error',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};
