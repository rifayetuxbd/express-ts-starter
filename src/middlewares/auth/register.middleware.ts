import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';
import { hash } from 'bcrypt';
import { db } from '../../db/db';
import { user } from '../../db/schema';
import { sendEmailVerificationCode } from '../../methods/email/send-email-verification-link';

const registerSchema = z.object({
  displayName: z
    .string({
      message: 'Display name is required',
    })
    .min(2, 'Display name must contain at least 2 character')
    .max(10, 'Maximum 10 characters allowed')
    .regex(/^[a-zA-Z0-9]+$/, 'Only alphabets and digits allowed')
    .trim(),
  email: z.string().email('Required valid email').trim(),
  password: z
    .string()
    .min(6, 'Minimum 6 characters required')
    .max(50, 'Maximum 50 characters allowed')
    .trim(),
});

type RegisterPostData = z.infer<typeof registerSchema>;

export const validateRegisterPostData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = {
    displayName: req.body.displayName,
    email: req.body.email,
    password: req.body.password,
  };

  const validatedInput = await registerSchema.safeParseAsync(input);

  if (validatedInput.success === false) {
    const nextError: NextError = {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid form value submitted',
      messageCode: 'auth/invalid-form',
      stackTrace: new Error('[ register.middleware ] zod schema failed'),
      zodError: validatedInput.error,
    };

    return next(nextError);
  }

  req.body.registerUserPostData = validatedInput.data;

  return next();
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { displayName, email, password } = req.body
    .registerUserPostData as RegisterPostData;

  try {
    // Check if user email is already registered or not
    const existingUser = await db.query.user.findFirst({
      columns: {
        userId: true,
        email: true,
      },
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      const nextError: NextError = {
        statusCode: StatusCodes.CONFLICT,
        message: 'Email is already in use',
        messageCode: 'auth/email-not-available',
      };

      return next(nextError);
    }

    // Hash password
    const hashPassword = await hash(password, 10);

    // insert user in database
    await db.insert(user).values({
      displayName: displayName,
      email: email,
      password: hashPassword,
    });

    // Send email verification link
    // Do not need to handle error
    // This will internally handle error
    sendEmailVerificationCode(email, displayName);

    res.status(StatusCodes.CREATED).send({
      message: 'user created',
    });
  } catch (error) {
    // console.log('[ Error ] failed to create user: ', error);

    const nextError: NextError = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      messageCode: 'auth/internal-server-error',
      stackTrace: new Error('[ register.middleware ] Failed tot create user', {
        cause: error,
      }),
    };

    return next(nextError);
  }
};
