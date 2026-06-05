import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://universex-m5nn.vercel.app";

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
