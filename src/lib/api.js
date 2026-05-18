import axios from "axios";

// Base URL: set VITE_API_URL when the API lives on another host (e.g. prod).
// In dev, omit VITE_API_URL so requests stay same-origin — Vite proxies `/api` to the backend (see vite.config.js).
const apiBaseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "" : "http://localhost:8080");

// 1. Create the Axios instance with the Base URL
const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Add a Request Interceptor
// This intercepts EVERY request before it leaves your frontend and attaches the JWT token
api.interceptors.request.use(
  (config) => {
    // Never attach auth headers to auth endpoints
    const url = String(config?.url || "");
    const isAuthEndpoint = url.startsWith("/api/auth/login") || url.startsWith("/api/auth/register");

    // Look for the token in localStorage
    const token = localStorage.getItem("jwt_token");
    
    // If we have a token, attach it to the Authorization header
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Optional: Add a Response Interceptor
// This can globally catch 401 Unauthorized errors if a token expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend says the token is invalid/expired, clear it and force login
      console.error("Session expired. Please log in again.");
      localStorage.removeItem("jwt_token");
      // window.location.href = "/login"; // Uncomment to auto-redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;