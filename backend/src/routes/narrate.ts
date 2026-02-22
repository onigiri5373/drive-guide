import { Hono } from 'hono';
import { generateNarration } from '../lib/gemini.js';
import type { NarrateRequest } from '../types/index.js';

const narrate = new Hono();

// Simple rate limiter
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (entry.count >= 4) {
    return true;
  }

  entry.count++;
  return false;
}

narrate.post('/', async (c) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';

  if (isRateLimited(ip)) {
    return c.json({ error: 'Rate limit exceeded. Please wait.' }, 429);
  }

  const body = await c.req.json<NarrateRequest>();

  // Validate required fields
  if (!body.poiName || !body.direction || body.latitude == null || body.longitude == null) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  try {
    const narration = await generateNarration(body);
    return c.json({ narration });
  } catch (err) {
    console.error('Narration generation failed:', err);
    return c.json({ error: 'Failed to generate narration' }, 500);
  }
});

export default narrate;
