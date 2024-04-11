/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  SERVICE_NAME,
  USERID_ATTRIBUTE,
  USERNAME_ATTRIBUTE,
} from './constants';
const serviceName = SERVICE_NAME;
import { instrument } from './instrumentation';
instrument(serviceName);
import https from 'https';
import express, { Express, Request, Response } from 'express';
import { setTimeout } from 'timers/promises';
import { trace } from '@opentelemetry/api';

const PORT: number = parseInt(process.env.PORT || '5005');
const app: Express = express();

const tracer = trace.getTracer(serviceName);

app.get('/users/:username', async (req: Request, res: Response) => {
  const username = req.params.username;
  trace.getActiveSpan().setAttribute(USERNAME_ATTRIBUTE, username);
  const id = await getUserHistory(username);
  res.send({
    message: `Hello ${username}, your user ID is ${id}`,
  });
});

const getUserHistory = async (username: string) => {
  console.log(`Fetching id for ${username}`);
  const id = Math.floor(Math.random() * 10);
  const response: UserInfo = JSON.parse(
    (await makeRequest(
      `https://jsonplaceholder.typicode.com/users/${id}`,
    )) as string,
  );
  trace.getActiveSpan().setAttribute(USERID_ATTRIBUTE, response.id);
  await tracer.startActiveSpan('calculate-user-intent', async (span) => {
    await calculateUserIntent();
    span.end();
  });
  return id;
};

const calculateUserIntent = async () => {
  // simulate inefficient algorithm
  await setTimeout(300);
};

function makeRequest(url: string) {
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(url, (res) => {
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
      res.on('error', (err) => {
        reject(err);
      });
    });
  });
}

class UserInfo {
  username: string;
  id: number;
}

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
