import axios from "axios";
import { getAccessToken, getRefreshToken, storeAccessToken, storeRefreshToken, clearTokens } from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://9h4oapssea.execute-api.us-east-1.amazonaws.com/dev";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: attempt token refresh, then retry original request
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't intercept auth calls — let them fail normally
    if (original?.url?.includes("/api/auth/")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.accessToken;

        storeAccessToken(newAccessToken);
        storeRefreshToken(data.data.refreshToken);

        refreshQueue.forEach((cb) => cb(newAccessToken));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch {
        refreshQueue = [];
        clearTokens();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
