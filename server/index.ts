import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reuse the existing Vercel-shape handlers. They accept (req, res) where
// req mostly matches Node.IncomingMessage and res matches ServerResponse —
// compatible enough with Express req/res for our simple JSON endpoints.
import itemsIndex from '../api/items/index.js';
import itemsBySku from '../api/items/[sku].js';
import txIndex from '../api/tx/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

// Small adapter: our handlers expect VercelRequest/VercelResponse. Cast safely
// — both share the Node HTTP base, and we only rely on .query/.body/.status/.json.
type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;
const wrap = (h: Handler) => async (req: Request, res: Response, next: NextFunction) => {
  try { await h(req, res); } catch (e) { next(e); }
};

app.get('/api/items', wrap(itemsIndex as unknown as Handler));
app.post('/api/items', wrap(itemsIndex as unknown as Handler));

app.all('/api/items/:sku', (req, res, next) => {
  // Map :sku route param to the query.sku shape the original Vercel handler reads.
  (req.query as Record<string, string>).sku = req.params.sku!;
  return wrap(itemsBySku as unknown as Handler)(req, res, next);
});

app.get('/api/tx', wrap(txIndex as unknown as Handler));
app.post('/api/tx', wrap(txIndex as unknown as Handler));

// Static client
const staticDir = path.resolve(__dirname, '..', 'dist');
app.use(express.static(staticDir, { maxAge: '1h', etag: true }));

// SPA fallback — anything not a file and not /api goes to index.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] error', err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`logitrack server on :${port}`));
