// Ensure env is loaded BEFORE anything else
import 'dotenv/config';

import { env } from './config/env.js';
import app from './app.js';

app.listen(env.PORT, () => {
  console.log(`VetCare+ API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
