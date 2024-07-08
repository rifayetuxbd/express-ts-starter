import { NextFunction, Request, Response } from 'express';

import { NextError } from '../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error: NextError = {
    statusCode: StatusCodes.NOT_FOUND,
    message: '404 - Route Not Found',
    requestedUrl: req.originalUrl,
  };
  next(error);
}
export function errorHandler(
  error: NextError,
  req: Request,
  res: Response<NextError>,
  next: NextFunction,
) {
  const statusCode = error.statusCode !== undefined ? res.statusCode : 500;

  const responseJson: NextError = {
    message: error.message,
  };

  if (process.env.NODE_ENV === 'production') {
    responseJson.stackTrace = error.stackTrace;
  }
  //
  if (error.zodError !== undefined) {
    responseJson.zodError = error.zodError;
  }

  res.status(statusCode).json(responseJson);
}
