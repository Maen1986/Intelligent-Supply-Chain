// Single shared API base for all frontend fetches.
// The API artifact serves under the /api path relative to this app's base URL.
export const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';
