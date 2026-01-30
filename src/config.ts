/**
 * API base URL for Vercel serverless routes.
 * Same origin in production (e.g. /api); override with VITE_API_URL if needed.
 */
export const API_BASE =
  typeof import.meta.env !== 'undefined' && import.meta.env?.VITE_API_URL != null
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : '';
