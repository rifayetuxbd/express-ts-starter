import { Request, Response, NextFunction } from 'express';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { AccessTokenData, UserData } from '../../types/auth.type';
import { db } from '../../db/db';
import { roleEnum } from '../../db/schema';
import { z } from 'zod';

export const validateAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const rawToken = req.header('authorization');

  if (rawToken === undefined) {
    const nextError: NextError = {
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Token not found',
      messageCode: 'auth/token-missing',
      stackTrace: new Error(
        '[ shared-auth.middleware ] Token was not found in the header authorization',
      ),
    };

    return next(nextError);
  }

  const token = rawToken.includes('Bearer')
    ? rawToken.replace('Bearer', '').trim()
    : rawToken;

  try {
    if (token === 'null' || token === 'undefined') {
      throw Error('Invalid access token', {
        cause: `Token can not be "null" or "undefined". Received: "${token}"`,
      });
    }

    const accessTokenData = jwt.verify(
      token,
      process.env.JWT_LOGIN_ACCESS_TOKEN_SECRET!,
    ) as {
      email: string;
      displayName: string;
      iat: number;
      exp: number;
    };

    req.body.accessTokenData = {
      ...accessTokenData,
      token: token,
    };

    return next();
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Invalid token. Access denied',
      messageCode: 'auth/access-denied',
      stackTrace: new Error(
        '[ shared-auth.middleware ] Token verification failed',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};

export const validateSessionId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const defaultUUID = '00000000-0000-0000-0000-000000000000';
  const sessionIdSchema = z.object({
    sessionId: z.string().uuid().default(defaultUUID),
  });

  const input = {
    sessionId: req.header('x-session-id'),
  };

  const validatedInput = await sessionIdSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    req.body.sessionId = defaultUUID;
  } else {
    req.body.sessionId = validatedInput.data.sessionId;
  }

  return next();
};

/**
 * This middleware validates the user from the access token
 * from 'validateAccessToken' middleware
 *
 * @dependency __Must call `validateAccessToken` before `validateUserFromAccessToken`__
 */
export const validateUserFromAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessTokenData = req.body.accessTokenData as
    | AccessTokenData
    | undefined;

  if (accessTokenData === undefined) {
    const nextError: NextError = {
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Missing validated token',
      messageCode: 'auth/missing-validated-token',
      stackTrace: new Error(
        '[ shared-auth.middleware ] accessTokenData found as undefined',
        {
          cause:
            'Did you forgot to call the validateAccessToken middleware before calling validateUserFromAccessToken',
        },
      ),
    };

    return next(nextError);
  }

  try {
    const userData: UserData | undefined = await db.query.user.findFirst({
      columns: {
        userId: true,
        emailVerified: true,
        role: true,
      },
      where: (users, { eq }) => eq(users.email, accessTokenData.email),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid token',
        messageCode: 'auth/invalid-token',
        stackTrace: new Error(
          '[ shared-auth.middleware ] User token is invalid',
          {
            cause: 'User not found in db',
          },
        ),
      };

      return next(nextError);
    }

    // Check if user email is verified or not
    if (userData.emailVerified === false) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'User email is not verified',
        messageCode: 'auth/email-not-verified',
        stackTrace: new Error(
          '[ shared-auth.middleware ] User email is not verified',
        ),
      };

      return next(nextError);
    }

    // Verify the role
    const isValidRole = roleEnum.enumValues.includes(userData.role);
    if (!isValidRole) {
      const nextError: NextError = {
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Access denied. Invalid role',
        messageCode: 'auth/invalid-role',
        stackTrace: new Error('[ shared-auth.middleware ] Access denied', {
          cause: `Role: ${userData.role} is not listed in roleEnum for drizzle role schema`,
        }),
      };

      return next(nextError);
    }

    req.body.userData = userData;
    return next();
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error(
        '[ shared-auth.middleware ] Failed to verify user from token',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};

/**
 * Clerk, manager and admin will have access
 *
 * @dependency __Must call `validateAccessToken` and `validateUserFromAccessToken` before__
 */
export const requireClerkRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = req.body.userData as UserData;

  if (role === 'user') {
    const nextError: NextError = {
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Access denied. Insufficient role',
      messageCode: 'auth/insufficient-role',
      stackTrace: new Error(
        '[ shared-auth.middleware ] User is not allowed to see this route',
        {
          cause: `Role: "${role}" - is not allowed to access the route`,
        },
      ),
    };

    return next(nextError);
  }

  return next();
};

/**
 * Manager and admin will have access
 *
 * @dependency __Must call `validateAccessToken` and `validateUserFromAccessToken` before__
 */
export const requireManagerRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = req.body.userData as UserData;

  if (role === 'user' || role === 'clerk') {
    const nextError: NextError = {
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Access denied. Insufficient role',
      messageCode: 'auth/insufficient-role',
      stackTrace: new Error(
        '[ shared-auth.middleware ] User is not allowed to see this route',
        {
          cause: `Role: "${role}" - is not allowed to access the route`,
        },
      ),
    };

    return next(nextError);
  }

  return next();
};

/**
 * Only admin will have access
 *
 * @dependency __Must call `validateAccessToken` and `validateUserFromAccessToken` before__
 */
export const requireAdminRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = req.body.userData as UserData;

  if (role === 'admin') {
    return next();
  } else {
    const nextError: NextError = {
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Access denied. Insufficient role',
      messageCode: 'auth/insufficient-role',
      stackTrace: new Error(
        '[ shared-auth.middleware ] User is not allowed to see this route',
        {
          cause: `Role: "${role}" - is not allowed to access the route`,
        },
      ),
    };

    return next(nextError);
  }
};
