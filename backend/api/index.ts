import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import narrate from '../src/routes/narrate.js';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

// CORS - allow Vercel frontend and localhost
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return 'http://localhost:5173';
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /https?:\/\/192\.168\.\d+\.\d+/.test(origin)
      ) {
        return origin;
      }
      if (origin.endsWith('.vercel.app')) {
        return origin;
      }
      const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowed.some((a) => origin.includes(a))) {
        return origin;
      }
      return 'http://localhost:5173';
    },
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Narration route
app.route('/narrate', narrate);

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default handle(app);
