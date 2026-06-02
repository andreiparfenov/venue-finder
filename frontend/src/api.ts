// Base URL for all API calls.
// In development Vite proxies /api → localhost:3001, so BASE is empty.
// In production set VITE_API_URL to your deployed backend URL, e.g.
//   https://venue-finder-api.onrender.com
const BASE = import.meta.env.VITE_API_URL ?? '';

export const api = {
  venues:   `${BASE}/api/venues`,
  insights: `${BASE}/api/insights`,
  chat:     `${BASE}/api/chat`,
};
