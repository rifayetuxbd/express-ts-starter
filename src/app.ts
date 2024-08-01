import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';

import {
  notFound,
  errorHandler,
} from './middlewares/common/common.middlewares';
import { MessageResponse } from './interfaces/message-response';
import { authRoute } from './routes/auth/auth.route';

import {
  validateAccessToken,
  validateUserFromAccessToken,
  requireClerkRole,
} from './middlewares/auth';
import { isValidEnvFile } from './utils/verify-env';
import { StatusCodes } from 'http-status-codes';

// Environments
config({ path: '.env' });

// Validate loaded .env file
if (!isValidEnvFile()) {
  throw new Error('[ TERMINATE ] Failed to run app');
}

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV !== 'production'
        ? ['http://localhost:6748', process.env.FRONTEND_APP_URL!]
        : process.env.FRONTEND_APP_URL!,
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'api is online',
  });
});

// Public route
app.use('/api/v1/auth', authRoute);

// Private route
app.use(
  '/api/v1/category',
  validateAccessToken,
  validateUserFromAccessToken,
  requireClerkRole,
  (req, res) => {
    return res.status(StatusCodes.OK).send({
      url: req.originalUrl,
      message: 'Sample private route',
    });
  },
);

// Must be at the end
app.use(notFound);
app.use(errorHandler);

export default app;
