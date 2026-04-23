import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import itemsIndex from '../api/items/index.js';
import itemsBySku from '../api/items/[sku].js';
import txIndex from '../api/tx/index.js';
import visionIndex from '../api/vision/index.js';
import userByOp from '../api/users/[operatorId].js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'https://logitrack-pwa.vercel.app')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / server-to-server
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    // Also allow any *.vercel.app preview (frontend preview deploys)
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.vercel.app')) return cb(null, true);
    } catch { /* ignore */ }
    cb(new Error(`Origin ${origin} not allowed`));
  },
  credentials: false,
}));

app.use(express.json({ limit: '8mb' }));

type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;
const wrap = (h: Handler) => async (req: Request, res: Response, next: NextFunction) => {
  try { await h(req, res); } catch (e) { next(e); }
};

app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.get('/api/items', wrap(itemsIndex as unknown as Handler));
app.post('/api/items', wrap(itemsIndex as unknown as Handler));

app.all('/api/items/:sku', wrap(itemsBySku as unknown as Handler));

app.get('/api/tx', wrap(txIndex as unknown as Handler));
app.post('/api/tx', wrap(txIndex as unknown as Handler));

app.post('/api/vision', wrap(visionIndex as unknown as Handler));

app.all('/api/users/:operatorId', wrap(userByOp as unknown as Handler));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] error', err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`logitrack api on :${port}`));
