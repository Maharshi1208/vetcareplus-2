// backend/src/index.ts
import 'dotenv/config';
import { env } from './config/env.js';
import app from './app.js';

const port = Number(env.PORT) || 4000;
app.listen(port, () => {
  console.log(`VetCare+ API listening on http://localhost:${port} (${env.NODE_ENV})`);
});
