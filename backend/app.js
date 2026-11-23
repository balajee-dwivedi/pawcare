import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDatabaseReady } from './db.js';
import { HttpError } from './http.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';
import adoptionRoutes from './routes/adoptionRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');
const uploadDir = path.resolve(currentDir, process.env.UPLOAD_DIR || 'uploads');
const clientDist = path.resolve(projectRoot, 'frontend/dist');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));

app.get('/api/health', (_req, res) => {
  const connected = isDatabaseReady();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'database_unavailable',
    database: connected ? 'mongodb' : 'not_connected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'API route not found.')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralized errors keep API messages helpful without exposing stack traces.
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error)
    return res.status(400).json({ message: 'Request body contains invalid JSON.' });
  const status =
    error.status ||
    (error.code?.startsWith('LIMIT_')
      ? 400
      : error.name === 'ValidationError'
        ? 400
        : error.name === 'CastError'
          ? 400
          : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({
    message:
      status === 500 ? 'Something went wrong on the server. Please try again.' : error.message,
  });
});

export default app;