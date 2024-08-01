import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import { eq } from 'drizzle-orm';
import { createAndSendPasswordResetEmail } from '../../methods/email/send-password-reset-email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Required valid email').trim(),
});

type ForgotPasswordPostData = z.infer<typeof forgotPasswordSchema>;

export const verifyForgotPasswordPostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    email: req.body.email,
  };

  const validatedInput = await forgotPasswordSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid email address',
      messageCode: 'auth/invalid-email',
      stackTrace: new Error('[ forgot-password.middleware ] zod schema failed'),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.forgotPasswordPostData = validatedInput.data;
  return next();
};

export const sendPasswordResetEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body.forgotPasswordPostData as ForgotPasswordPostData;
  // 1. Get user based on verification code and email
  try {
    const userData = await db.query.user.findFirst({
      columns: {
        userId: true,
        email: true,
        displayName: true,
      },
      where: (users, { and }) => and(eq(users.email, email)),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Email address not found',
        messageCode: 'auth/email-not-found',
        stackTrace: new Error(
          '[ forgot-password.middleware ] no user data found for the email address',
        ),
      };

      return next(nextError);
    }

    // send password reset email
    await createAndSendPasswordResetEmail(userData.email, userData.displayName);

    res.status(StatusCodes.OK).send({
      message: 'Password reset email sent',
    });
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong.',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error(
        '[ forgot-password.middleware ] Internal server error',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};
