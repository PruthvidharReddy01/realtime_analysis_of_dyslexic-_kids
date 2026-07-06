// Centralized API configuration
// In production, set VITE_API_URL and VITE_SOCKET_URL as environment variables on Render
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
