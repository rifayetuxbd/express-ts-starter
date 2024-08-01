import { NextFunction, Request, Response } from 'express';

import { NextError } from '../../interfaces/next-error';
import { StatusCodes } from 'http-status-codes';

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error: NextError = {
    statusCode: StatusCodes.NOT_FOUND,
    message: '404 - Route Not Found',
    messageCode: 'common/404-not-found',
  };
  return next(error);
}

export function errorHandler(
  error: NextError,
  req: Request,
  res: Response<NextError>,
  // This next function is required
  // If not present, errors will not be able to parsed
  // correctly. No need to use in function body
  next: NextFunction,
) {
  const statusCode = error.statusCode;

  const responseJson: NextError = {
    message: error.message,
    messageCode: error.messageCode,
    statusCode: statusCode,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.error(
      '[ Stacktrace ] logged from common.middleware\n',
      error.stackTrace,
    );

    responseJson.requestedUrl = req.originalUrl;
    responseJson.stackTrace = error.stackTrace;
    responseJson.zodError = error.zodError;
  }
  //

  return res.status(statusCode).send(responseJson);
}
