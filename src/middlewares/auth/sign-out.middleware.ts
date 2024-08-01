import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import { eq } from 'drizzle-orm';
import { authorization, user } from '../../db/schema';

const signOutPostDataSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

type SignOutPostData = z.infer<typeof signOutPostDataSchema>;

export const validateSignOutPostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    userId: req.body.userId,
    sessionId: req.body.sessionId,
  };

  const validatedInput = await signOutPostDataSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid user id or session id',
      messageCode: 'auth/invalid-data',
      stackTrace: new Error('[ sign-out.middleware ] zod schema failed'),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.signOutPostData = validatedInput.data;

  return next();
};

export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId, sessionId } = req.body.signOutPostData as SignOutPostData;

  try {
    const userData = await db.query.user.findFirst({
      with: {
        authorization: {
          columns: {
            authorizationId: true,
          },
          where: eq(authorization.sessionId, sessionId),
        },
      },
      columns: {
        userId: true,
      },
      where: eq(user.userId, userId),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid user id',
        messageCode: 'auth/invalid-user-id',
        stackTrace: new Error(
          '[ sign-out.middleware ] User Id is not listed on database',
        ),
      };

      return next(nextError);
    }

    if (userData.authorization.length === 0) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid session id',
        messageCode: 'auth/invalid-session-id',
        stackTrace: new Error(
          '[ sign-out.middleware ] User session Id is not listed on database',
        ),
      };

      return next(nextError);
    }

    // Remove the session
    await db
      .delete(authorization)
      .where(
        eq(
          authorization.authorizationId,
          userData.authorization[0].authorizationId,
        ),
      );

    return res.status(StatusCodes.OK).send({
      message: 'User signed out',
    });
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error('[ sign-out.middleware ] Failed to sign out user', {
        cause: error,
      }),
    };

    return next(nextError);
  }
};
