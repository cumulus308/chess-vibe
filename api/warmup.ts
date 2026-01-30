import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Lightweight endpoint for cron to keep serverless runtime warm.
 * Set in vercel.json crons (e.g. every 5 min) to reduce cold starts.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).setHeader('Content-Type', 'application/json').end(JSON.stringify({ ok: true }));
}
