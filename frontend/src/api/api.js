import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && baseURL.includes('localhost')) {
  // If .env carried over localhost to production Vercel build, fallback to deployed backend
  baseURL = 'https://spiltwise-clone-backend.vercel.app/api/v1'; 
}

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;
