import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import narrate from './routes/narrate.js';

const app = new Hono();

// CORS - allow localhost, LAN, and production domains
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return 'http://localhost:5173';
      // Allow localhost and LAN
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /https?:\/\/192\.168\.\d+\.\d+/.test(origin)
      ) {
        return origin;
      }
      // Allow configured production origins (e.g. Vercel deployment)
      if (ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
        return origin;
      }
      // Allow any .vercel.app domain
      if (origin.endsWith('.vercel.app')) {
        return origin;
      }
      return 'http://localhost:5173';
    },
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Narration route
app.route('/api/narrate', narrate);

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '3001');

const apiKey = process.env.GEMINI_API_KEY;
const isDemo = !apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.length <= 10;

console.log(`🚗 Drive Guide API server running on port ${port}`);
if (isDemo) {
  console.log('⚠️  DEMO MODE: GEMINI_API_KEY が未設定です。モック案内を返します。');
  console.log('   本番モードにするには backend/.env にAPIキーを設定してください。');
  console.log('   取得先: https://aistudio.google.com/apikey');
} else {
  console.log('✅ Gemini API 接続OK');
}

serve({
  fetch: app.fetch,
  port,
});
