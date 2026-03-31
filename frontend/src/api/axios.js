import axios from "axios";
import { authStorageKey } from "../app/providers/AppProviders";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(authStorageKey);
  if (!raw) {
    return config;
  }

  try {
    const session = JSON.parse(raw);
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch {
    localStorage.removeItem(authStorageKey);
  }

  return config;
});

export default api;