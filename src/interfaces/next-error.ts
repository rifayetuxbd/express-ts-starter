import { z } from 'zod';

interface CustomMessage {
  code?: string;
  message: string;
}

export interface NextError {
  statusCode?: number;
  message: string | string[] | CustomMessage[];
  stackTrace?: Error | null;
  zodError?: z.ZodError;
  requestedUrl?: string;
}
