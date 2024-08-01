import { z } from 'zod';

const NODE_ENV = ['development', 'production', 'test'] as const;

// verify the .env using schema
const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV, {
    message: 'NODE_ENV can be either "development", "production" or "test"',
  }),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_EMAIL_VERIFICATION_TOKEN_SECRET: z
    .string()
    .min(88, 'JWT_EMAIL_VERIFICATION_TOKEN_SECRET can not be less than 88 char')
    .max(88, 'JWT_EMAIL_VERIFICATION_TOKEN_SECRET must not excess 88 char'),
  JWT_LOGIN_ACCESS_TOKEN_SECRET: z
    .string()
    .min(88, 'JWT_LOGIN_ACCESS_TOKEN_SECRET can not be less than 88 char')
    .max(88, 'JWT_LOGIN_ACCESS_TOKEN_SECRET must not excess 88 char'),
  JWT_LOGIN_REFRESH_TOKEN_SECRET: z
    .string()
    .min(88, 'JWT_LOGIN_REFRESH_TOKEN_SECRET can not be less than 88 char')
    .max(88, 'JWT_LOGIN_REFRESH_TOKEN_SECRET must not excess 128 char'),
  JWT_PASSWORD_RESET_TOKEN_SECRET: z
    .string()
    .min(88, 'JWT_PASSWORD_RESET_TOKEN_SECRET can not be less than 88 char')
    .max(88, 'JWT_PASSWORD_RESET_TOKEN_SECRET must not excess 128 char'),
  NODE_MAILER_EMAIL: z
    .string({ required_error: 'NODE_MAILER_EMAIL is required' })
    .email('NODE_MAILER_EMAIL must be a valid email'),
  NODE_MAILER_EMAIL_PASSWORD: z
    .string({ required_error: 'NODE_MAILER_EMAIL_PASSWORD is required' })
    .min(1, 'NODE_MAILER_EMAIL_PASSWORD is required'),
  NODE_MAILER_EMAIL_FROM: z
    .string({ required_error: 'NODE_MAILER_EMAIL_FROM is required' })
    .min(1, 'NODE_MAILER_EMAIL_FROM is required'),
  NODE_MAILER_EMAIL_ADDRESS: z
    .string({ required_error: 'NODE_MAILER_EMAIL_ADDRESS is required' })
    .email('NODE_MAILER_EMAIL_ADDRESS must be a valid email'),
  FRONTEND_APP_URL: z
    .string({ required_error: 'FRONTEND_APP_URL is required' })
    .min(1, 'FRONTEND_APP_URL is required')
    .url('FRONTEND_APP_URL must be a url'),
});

export const isValidEnvFile = () => {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_EMAIL_VERIFICATION_TOKEN_SECRET:
      process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
    JWT_LOGIN_ACCESS_TOKEN_SECRET: process.env.JWT_LOGIN_ACCESS_TOKEN_SECRET,
    JWT_LOGIN_REFRESH_TOKEN_SECRET: process.env.JWT_LOGIN_REFRESH_TOKEN_SECRET,
    JWT_PASSWORD_RESET_TOKEN_SECRET:
      process.env.JWT_PASSWORD_RESET_TOKEN_SECRET,
    NODE_MAILER_EMAIL: process.env.NODE_MAILER_EMAIL,
    NODE_MAILER_EMAIL_PASSWORD: process.env.NODE_MAILER_EMAIL_PASSWORD,
    NODE_MAILER_EMAIL_FROM: process.env.NODE_MAILER_EMAIL_FROM,
    NODE_MAILER_EMAIL_ADDRESS: process.env.NODE_MAILER_EMAIL_ADDRESS,
    /** replace all single quote to double quote */
    FRONTEND_APP_URL: process.env.FRONTEND_APP_URL,
  };

  // console.log(env);

  const validatedEnv = envSchema.safeParse(env);

  if (validatedEnv.success === true) {
    console.log('[ info ] valid .env file');
  } else {
    console.error(
      '[ error ] Invalid .env file\n\t',
      validatedEnv.error.flatten().fieldErrors,
    );
    console.error({
      loadedEnv: env,
    });
  }

  return validatedEnv.success;
};
