import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '.env') });

// Import after dotenv configuration because app middleware reads environment values at startup.
const [{ default: app }, { connectMongo }, { warmupClassifier }] = await Promise.all([
  import('./app.js'),
  import('./db.js'),
  import('./imageCheck.js'),
]);

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(isProduction ? process.env.PORT || 3000 : process.env.API_PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

// Keep the HTTP server available if MongoDB is missing so the client can show a useful error.
await connectMongo();
app.listen(port, host, () => {
  console.log(`PawCare API listening on ${host}:${port}`);
  warmupClassifier();
});