import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import { hash } from 'bcrypt';
import { authorization, user } from '../../db/schema';
import jwt from 'jsonwebtoken';
import { UUID } from 'crypto';
import { eq } from 'drizzle-orm';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Minimum 6 characters required')
    .max(50, 'Maximum 50 characters allowed')
    .trim(),
  passwordResetCode: z
    .string()
    .min(20, 'Minimum 20 characters required')
    .max(20, 'Maximum 20 characters allowed')
    .trim(),
});

type ResetPasswordPostData = z.infer<typeof resetPasswordSchema>;

export const validateResetPasswordPostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    password: req.body.password,
    passwordResetCode: req.body.passwordResetCode,
  };

  const validatedInput = await resetPasswordSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid password or password reset code',
      messageCode: 'auth/invalid-password',
      stackTrace: new Error('[ reset-password.middleware ] zod schema failed'),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.resetPasswordPostData = validatedInput.data;

  return next();
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { password, passwordResetCode } = req.body
    .resetPasswordPostData as ResetPasswordPostData;

  // Check if user exists
  try {
    const sessionId = req.body.sessionId as UUID;

    const userData = await db.query.user.findFirst({
      columns: {
        userId: true,
        displayName: true,
        email: true,
        passwordResetToken: true,
      },
      where: eq(user.passwordResetCode, passwordResetCode),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid password reset code',
        messageCode: 'auth/invalid-code',
        stackTrace: new Error(
          '[ reset-password.middleware ] Password reset code not found',
          {
            cause: 'Provided password reset code is not listed in the database',
          },
        ),
      };

      return next(nextError);
    }

    // Verify token
    if (userData.passwordResetToken === null) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Missing token. Try resetting password again',
        messageCode: 'auth/reset-token-missing',
        stackTrace: new Error(
          '[ reset-password.middleware ] Token is missing in db. Found null',
        ),
      };

      return next(nextError);
    }

    try {
      jwt.verify(
        userData.passwordResetToken,
        process.env.JWT_PASSWORD_RESET_TOKEN_SECRET!,
      );
    } catch (error: any) {
      let message = '';
      let stackTraceMessage = '';
      if (error?.name === 'TokenExpiredError') {
        message = 'Token expired. Try resetting password again';
        stackTraceMessage = 'Token expired. Create new token';
      } else {
        message = 'Invalid token. Try resetting password';
        stackTraceMessage = 'Invalid token. Recreate token again';
      }

      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: message,
        messageCode: 'auth/reset-password',
        stackTrace: new Error(
          `[ reset-password.middleware ] ${stackTraceMessage}`,
          {
            cause: error,
          },
        ),
      };

      return next(nextError);
    }

    // Hash password
    const hashPassword = await hash(password, 10);

    // Update password, passwordResetToken, passwordResetCode fields
    await db.update(user).set({
      passwordResetCode: null,
      passwordResetToken: null,
      password: hashPassword,
      updatedAt: new Date(),
    });

    // Delete existing session
    await db
      .delete(authorization)
      .where(eq(authorization.sessionId, sessionId));

    res.status(StatusCodes.OK).send({
      message:
        'Password reset success. You can now login with your new password',
    });
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error(
        '[ reset-password.middleware ] Failed to reset user',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};
