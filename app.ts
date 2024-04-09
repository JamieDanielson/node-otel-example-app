/* eslint-disable @typescript-eslint/no-base-to-string */
import express, { Express, Request, Response } from 'express';
import { trace } from '@opentelemetry/api';

const PORT: number = parseInt(process.env.PORT || '5005');
const app: Express = express();

app.get('/profile', (req: Request, res: Response) => {
  const span = trace.getActiveSpan();
  const age = Math.floor(Math.random() * 100);
  span?.setAttribute('age', age);
  const firstname = req.query?.firstname?.toString();
  const surname = req.query?.surname?.toString();
  res.send({
    name: `${firstname} ${surname}`,
    age,
  });
});

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
