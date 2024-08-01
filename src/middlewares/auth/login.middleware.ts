import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authorization, user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { User } from '../../types/auth.type';
import { UUID } from 'crypto';

const loginSchema = z.object({
  email: z.string().email('Required valid email').trim(),
  password: z
    .string()
    .min(6, 'Minimum 6 characters required')
    .max(50, 'Maximum 50 characters allowed')
    .trim(),
});

type LoginPostData = z.infer<typeof loginSchema>;

export const validateLoginPostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    email: req.body.email,
    password: req.body.password,
  };

  const validatedInput = await loginSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid email or password',
      messageCode: 'auth/invalid-user',
      stackTrace: new Error('[ login.middleware ] zod schema failed'),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.loginPostData = validatedInput.data;

  return next();
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body.loginPostData as LoginPostData;

  // If valid user agent (header) not found do not allow to login
  const userAgent = req.header('user-agent');

  if (userAgent === undefined) {
    const nextError: NextError = {
      statusCode: StatusCodes.FORBIDDEN,
      message: 'Invalid or no browser detected',
      messageCode: 'auth/not-browser',
      stackTrace: new Error(
        '[ login.middleware ] No user agent header found in the request',
      ),
    };

    return next(nextError);
  }

  // Check if user exists
  try {
    const sessionId = req.body.sessionId as UUID;
    // console.log({
    //   sessionId,
    // });

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
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        phone: true,
        profilePhotoUrl: true,
        emailVerified: true,
        phoneVerified: true,
        password: true,
        role: true,
      },
      where: eq(user.email, email),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid email or password',
        messageCode: 'auth/invalid-user',
        stackTrace: new Error(
          '[ login.middleware ] User email is not listed in the database',
        ),
      };

      return next(nextError);
    }

    // verify/compare the password using bcrypt
    const isPasswordMatched = await compare(password, userData.password);

    if (isPasswordMatched === false) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid email or password',
        messageCode: 'auth/invalid-user',
        stackTrace: new Error(
          '[ login.middleware ] User password does not matched',
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
          '[ login.middleware ] User email is not verified',
        ),
      };

      return next(nextError);
    }

    // Valid email and password found
    // Create access and refresh token
    const accessToken = jwt.sign(
      {
        email: userData.email,
        displayName: userData.displayName,
      },
      process.env.JWT_LOGIN_ACCESS_TOKEN_SECRET!,
      {
        // TODO: when refresh token system is enabled then decrease
        // this expiresIn to shorter time. Eg. 1h
        expiresIn: '2d',
      },
    );

    const refreshToken = jwt.sign(
      {
        email: userData.email,
        displayName: userData.displayName,
      },
      process.env.JWT_LOGIN_REFRESH_TOKEN_SECRET!,
      {
        expiresIn: '30d',
      },
    );

    // save refresh token on database
    let updatedSessionId = '';
    if (userData.authorization.length === 1) {
      // Update the row for the authorization table
      await db
        .update(authorization)
        .set({
          refreshToken: refreshToken,
          userAgent: userAgent,
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        })
        .where(
          eq(
            authorization.authorizationId,
            userData.authorization[0].authorizationId,
          ),
        );

      updatedSessionId = sessionId;
    } else {
      // insert new row for authorization table
      const authorizationInsert = await db
        .insert(authorization)
        .values({
          userId: userData.userId,
          refreshToken: refreshToken,
          userAgent: userAgent,
        })
        .returning({
          sessionId: authorization.sessionId,
        });

      updatedSessionId = authorizationInsert[0].sessionId;
    }

    // console.log({
    //   refreshToken: req.cookies.refreshToken,
    // });

    // // TODO: Set http only cookie
    // res.cookie('refreshToken', refreshToken, {
    //   maxAge: 36_000 * 60 * 1_000,
    //   httpOnly: true,
    //   secure: false,
    //   path: '/',
    // });

    const userDataToSend: User = {
      userId: userData.userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      profilePhotoUrl: userData.profilePhotoUrl,
      emailVerified: userData.emailVerified,
      phoneVerified: userData.phoneVerified,
      role: userData.role,
      sessionId: updatedSessionId,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };

    return res.status(StatusCodes.OK).send(userDataToSend);
  } catch (error) {
    // console.error('[ login.middleware ] Failed to log in user');

    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error('[ login.middleware ] Failed to log in user', {
        cause: error,
      }),
    };

    return next(nextError);
  }
};
