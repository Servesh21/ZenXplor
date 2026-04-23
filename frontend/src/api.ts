/**
 * api.ts — centralised backend URL for all fetch/axios calls.
 *
 * In development:  set VITE_BACKEND_URL=http://localhost:5000 in .env
 * In production:   set VITE_BACKEND_URL=https://your-app.onrender.com in Vercel env vars
 */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
export const AGENT_URL   = "https://127.0.0.1:7832";
