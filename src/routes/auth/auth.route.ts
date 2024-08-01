import express from 'express';
import {
  validateLoginPostData,
  validateRegisterPostData,
  createUser,
  verifyEmailPostData,
  verifyEmail,
  resendEmailVerificationLink,
  validateResendEmailVerificationCodePostData,
  login,
  // validateVerifyTokenPostData,
  verifyToken,
  validateAccessToken,
  verifyForgotPasswordPostData,
  sendPasswordResetEmail,
  validateResetPasswordPostData,
  resetPassword,
  validateSessionId,
  validateSignOutPostData,
  signOut,
} from '../../middlewares/auth';

export const authRoute = express.Router();

authRoute.post('/login', validateLoginPostData, validateSessionId, login);

authRoute.post('/register', validateRegisterPostData, createUser);

authRoute.post('/verify-email', verifyEmailPostData, verifyEmail);

authRoute.post(
  '/resend-email-verification-code',
  validateResendEmailVerificationCodePostData,
  resendEmailVerificationLink,
);

/**
 * This route will be used for validating token for auth guards from frontend
 */
authRoute.get(
  '/verify-token',
  validateSessionId,
  validateAccessToken,
  verifyToken,
);

authRoute.post(
  '/forgot-password',
  verifyForgotPasswordPostData,
  sendPasswordResetEmail,
);

authRoute.post(
  '/reset-password',
  validateResetPasswordPostData,
  validateSessionId,
  resetPassword,
);

authRoute.post(
  '/sign-out',
  validateAccessToken,
  validateSignOutPostData,
  signOut,
);
