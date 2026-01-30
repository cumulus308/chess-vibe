import type { VercelResponse } from '@vercel/node';

export function json(res: VercelResponse, data: unknown, status = 200): void {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(data));
}

export function err(res: VercelResponse, message: string, status = 400): void {
  json(res, { error: message }, status);
}
