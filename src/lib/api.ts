/**
 * Single source of truth for the backend URL.
 * In production: set NEXT_PUBLIC_API_URL to your Railway backend URL.
 * In development: falls back to http://localhost:8000
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Returns the correct WebSocket URL for the backend.
 * Converts http -> ws, https -> wss automatically.
 */
export function getWsUrl(path: string): string {
  const base = BACKEND_URL.replace(/^http/, "ws");
  return `${base}${path}`;
}
