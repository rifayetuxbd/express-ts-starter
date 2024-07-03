import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import { notFound, errorHandler } from './middlewares/common.middlewares';
import { MessageResponse } from './interfaces/message-response';

require('dotenv').config();

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'api is online',
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
