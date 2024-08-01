import { Request, Response, NextFunction } from 'express';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/db';
import { AccessTokenData, User } from '../../types/auth.type';
import { UUID } from 'crypto';
// import { z } from 'zod';
// import { roleEnum } from '../../db/schema';

// const verifyTokenSchema = z.object({
//   url: z.string().min(1, 'Url is required').trim(),
// });

// type VerifyTokenPostData = z.infer<typeof verifyTokenSchema>;

// export const validateVerifyTokenPostData = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const input = {
//     url: req.body.url,
//   };

//   const validatedInput = await verifyTokenSchema.safeParseAsync(input);

//   if (validatedInput.success === false) {
//     const nextError: NextError = {
//       statusCode: StatusCodes.BAD_REQUEST,
//       message: 'Invalid url',
//       messageCode: 'auth/invalid-url',
//       stackTrace: new Error('[ verify-token.middleware ] zod schema failed'),
//       zodError: validatedInput.error,
//     };

//     return next(nextError);
//   }

//   req.body.verifyTokenPostData = validatedInput.data;

//   return next();
// };

/**
 * Only use for validating token using the auth guards from frontend
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // const { url } = req.body.verifyTokenPostData as VerifyTokenPostData;
  // const isAdminRoute = url.includes('/admin/');

  try {
    const accessTokenData = req.body.accessTokenData as
      | AccessTokenData
      | undefined;

    if (accessTokenData === undefined) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Missing validated token',
        messageCode: 'auth/missing-validated-token',
        stackTrace: new Error(
          '[ verify-token.middleware ] accessTokenData found as undefined',
          {
            cause:
              'Did you forgot to call the validateAccessToken middleware before calling verifyToken?',
          },
        ),
      };

      return next(nextError);
    }

    const sessionId = req.body.sessionId as UUID;

    const userData = await db.query.user.findFirst({
      with: {
        authorization: {
          columns: {
            authorizationId: true,
            refreshToken: true,
          },
          where: (authorizations, { eq }) =>
            eq(authorizations.sessionId, sessionId),
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
      where: (users, { eq }) => eq(users.email, accessTokenData.email),
    });

    if (!userData) {
      const nextError: NextError = {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Invalid token',
        messageCode: 'auth/invalid-token',
        stackTrace: new Error('[ login.middleware ] User token is invalid', {
          cause: 'User not found in db',
        }),
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

    // TODO: create a complete route configuration here
    // if (isAdminRoute) {
    //   // TODO: check for clear role based access control here
    //   const managerNotAllowedUrl: string[] = [
    //     // List of url that is only for admin and not allowed for manager
    //     '/admin/users',
    //   ];
    //   const clerkNotAllowedUrl: string[] = [
    //     ...managerNotAllowedUrl,
    //     // other list here
    //   ];

    //   const isValidRole = roleEnum.enumValues.includes(userData.role);
    //   if (!isValidRole) {
    //     const nextError: NextError = {
    //       statusCode: StatusCodes.FORBIDDEN,
    //       message: 'Access denied. Invalid role',
    //       messageCode: 'auth/invalid-role',
    //       stackTrace: new Error('[ verify-token.middleware ] Access denied', {
    //         cause: 'Role is not listed in roleEnum for drizzle role schema',
    //       }),
    //     };

    //     return next(nextError);
    //   }

    //   if (userData.role === 'user') {
    //     const nextError: NextError = {
    //       statusCode: StatusCodes.FORBIDDEN,
    //       message: 'Access denied',
    //       messageCode: 'auth/access-denied',
    //       stackTrace: new Error('[ verify-token.middleware ] Access denied', {
    //         cause: 'Found role user to access admin route',
    //       }),
    //     };

    //     return next(nextError);
    //   } else if (
    //     userData.role === 'clerk' &&
    //     clerkNotAllowedUrl.includes(url)
    //   ) {
    //     const nextError: NextError = {
    //       statusCode: StatusCodes.FORBIDDEN,
    //       message: 'Access denied',
    //       messageCode: 'auth/access-denied',
    //       stackTrace: new Error('[ verify-token.middleware ] Access denied', {
    //         cause: `Clerk is not allowed to view ${url}`,
    //       }),
    //     };

    //     return next(nextError);
    //   } else if (
    //     userData.role === 'manager' &&
    //     managerNotAllowedUrl.includes(url)
    //   ) {
    //     const nextError: NextError = {
    //       statusCode: StatusCodes.FORBIDDEN,
    //       message: 'Access denied',
    //       messageCode: 'auth/access-denied',
    //       stackTrace: new Error('[ verify-token.middleware ] Access denied', {
    //         cause: `Manager is not allowed to view ${url}`,
    //       }),
    //     };

    //     return next(nextError);
    //   } else {
    //     // do nothing
    //     // Allowed to view all page
    //   }
    // }

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
      sessionId: sessionId,
      refreshToken: userData.authorization[0].refreshToken,
      accessToken: accessTokenData.token,
    };

    return res.status(StatusCodes.OK).send(userDataToSend);
  } catch (error) {
    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error(
        '[ verify-token.middleware ] Failed to verify token',
        {
          cause: error,
        },
      ),
    };

    return next(nextError);
  }
};
