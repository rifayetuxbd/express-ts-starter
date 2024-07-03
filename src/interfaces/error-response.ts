import { MessageResponse } from './message-response';

export interface ErrorResponse extends MessageResponse {
  stack?: string;
}
