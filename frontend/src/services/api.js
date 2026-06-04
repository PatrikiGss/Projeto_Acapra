import axios from "axios";

const envBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseURL = envBaseURL
  ? envBaseURL.replace(/\/+$/, "")
  : import.meta.env.DEV
    ? ""
    : `${window.location.protocol}//${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: apiBaseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const API_HOST =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

export function getMediaURL(path) {
  if (!path) return "/adocao-cachorro.png";

  if (path.startsWith("http")) return path;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // garante que sempre começa com /media
  const finalPath = cleanPath.startsWith("/media")
    ? cleanPath
    : `/media/${cleanPath.replace(/^\/+/, "")}`;

  return `${API_HOST}${finalPath}`;
}

export default api;
