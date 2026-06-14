import axios from "axios";

const isDevelopment = import.meta.env.MODE === "development";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isDevelopment ? "http://localhost:5000" : "https://universex-m5nn.vercel.app");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (window.localStorage.getItem("universexDemoSession") === "true") {
    config.headers = config.headers || {};
    config.headers["X-UniVerseX-Mode"] = "demo";
  }
  return config;
});

export default api;
