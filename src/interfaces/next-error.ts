import { z } from 'zod';

interface CustomMessage {
  code?: string;
  message: string;
}

export interface NextError {
  statusCode: number;
  message: string | string[] | CustomMessage[];
  messageCode: string;
  stackTrace?: Error | null;
  zodError?: z.ZodError;
  /**
   * Will be populated by the common-middleware
   */
  requestedUrl?: string;
}
