import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import { user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const verifyEmailSchema = z.object({
  email: z.string().email('Required valid email').trim(),
  verificationCode: z
    .string()
    .min(6, 'Minimum 6 characters required')
    .max(6, 'Maximum 6 characters allowed')
    .trim(),
});

type VerifyEmailPostData = z.infer<typeof verifyEmailSchema>;

export const verifyEmailPostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    email: req.body.email,
    verificationCode: req.body.verificationCode,
  };

  const validatedInput = await verifyEmailSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid email or code',
      messageCode: 'auth/invalid-input',
      stackTrace: new Error('[ verify-email.middleware ] zod schema failed'),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.verifyEmailPostData = validatedInput.data;
  return next();
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, verificationCode } = req.body
    .verifyEmailPostData as VerifyEmailPostData;
  // 1. Get user based on verification code and email
  try {
    const userData = await db.query.user.findFirst({
      columns: {
        userId: true,
        email: true,
        emailVerificationToken: true,
        emailVerificationCodeLastSentAt: true,
        emailVerificationCodeSentCount: true,
        emailVerified: true,
      },
      where: (users, { and }) =>
        and(
          eq(users.email, email),
          eq(users.verificationCode, verificationCode),
        ),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid email or code',
        messageCode: 'auth/invalid-input',
        stackTrace: new Error(
          '[ verify-email.middleware ] no user data found for the email and verification code',
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
          '[ verify-email.middleware ] user email is already verified',
        ),
      };

      return next(nextError);
    }

    // 2. Verify the verificationEmailToken
    if (userData.emailVerificationToken === null) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Missing token. Try resending the verification email',
        messageCode: 'auth/token-missing',
        stackTrace: new Error(
          '[ verify-email.middleware ] Token is missing in db. Found null',
        ),
      };

      return next(nextError);
    }

    try {
      jwt.verify(
        userData.emailVerificationToken,
        process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET!,
      );
    } catch (error: any) {
      let message = '';
      let stackTrace = '';
      if (error?.name === 'TokenExpiredError') {
        message = 'Token expired. Try resending email verification code again';
        stackTrace = 'Token expired. Resend token again';
      } else {
        message = 'Invalid token. Try resending the verification email';
        stackTrace = 'Invalid token. Resend token again';
      }

      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: message,
        messageCode: 'auth/resend-email-verification',
        stackTrace: new Error(`[ verify-email.middleware ] ${stackTrace}`, {
          cause: error,
        }),
      };

      return next(nextError);
    }

    // 3. If valid update db to set email verification to true
    await db
      .update(user)
      .set({
        emailVerified: true,
        verificationCode: null,
        emailVerificationToken: null,
        emailVerificationCodeLastSentAt: null,
        emailVerificationCodeSentCount: null,
        updatedAt: new Date(),
      })
      .where(eq(user.email, email));

    res.status(StatusCodes.OK).send({
      message: 'Email verified',
    });
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong.',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error(
        '[ verify-email.middleware ] Internal server error',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};
