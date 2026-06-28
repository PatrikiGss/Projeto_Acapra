import axios from "axios";
import { clearAuthSession, isJwtExpired } from "../utils/auth";

const envBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const envMediaBaseURL = import.meta.env.VITE_MEDIA_BASE_URL?.trim();
const usesViteProxy = import.meta.env.DEV && !envBaseURL;

function getLocalBackendBaseURL() {
  const host = window.location.hostname;

  // O runserver do Django local nao fala HTTPS.
  if (["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    return `http://${host}:8000`;
  }

  return `${window.location.protocol}//${host}:8000`;
}

const apiBaseURL = envBaseURL
  ? envBaseURL.replace(/\/+$/, "")
  : usesViteProxy
    ? ""
    : getLocalBackendBaseURL();

// Timeout evita requisições penduradas (resource exhaustion / UX travada).
const REQUEST_TIMEOUT = 30000;

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: REQUEST_TIMEOUT,
});

const authClient = axios.create({
  baseURL: apiBaseURL,
  timeout: REQUEST_TIMEOUT,
});

let refreshPromise = null;

function shouldSkipAuthRedirect(url = "") {
  return [
    "/api/gerenciamento/auth/login/",
    "/api/gerenciamento/auth/register/",
    "/api/gerenciamento/auth/refresh/",
  ].some((path) => String(url).includes(path));
}

function redirectToLogin() {
  if (window.location.pathname === "/login") {
    return;
  }

  window.location.assign("/login");
}

function handleAuthFailure(originalRequest) {
  if (originalRequest && shouldSkipAuthRedirect(originalRequest.url)) {
    return false;
  }

  clearAuthSession();
  redirectToLogin();
  return true;
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");

  if (!refresh || isJwtExpired(refresh)) {
    clearAuthSession();
    throw new Error("Sessão expirada.");
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = authClient
    .post("/api/gerenciamento/auth/refresh/", { refresh })
    .then((response) => {
      const access = response.data?.access;

      if (!access) {
        throw new Error("Não foi possível renovar o token.");
      }

      localStorage.setItem("access", access);
      return access;
    })
    .catch((error) => {
      clearAuthSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  if (token) {
    if (isJwtExpired(token) && refresh && !isJwtExpired(refresh)) {
      try {
        const newToken = await refreshAccessToken();
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return config;
      } catch {
        // Se a renovação falhar, a sessão local já foi limpa.
      }

      return config;
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || "").includes("/api/gerenciamento/auth/refresh/")
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        handleAuthFailure(originalRequest);
      }
    }

    if (status === 401) {
      handleAuthFailure(originalRequest);
    }

    return Promise.reject(error);
  }
);

const MEDIA_BASE_URL = envMediaBaseURL
  ? envMediaBaseURL.replace(/\/+$/, "")
  : usesViteProxy
    ? ""
    : apiBaseURL
      ? new URL(apiBaseURL, window.location.origin).origin
      : window.location.origin;

function buildMediaPath(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // O backend serve a mídia em MEDIA_URL = "/media/" (tanto em dev quanto em
  // produção via SERVE_MEDIA). Caminhos já prefixados (/media/ ou o legado
  // /api/media/) passam direto; caminhos "crus" recebem o prefixo /media/.
  if (cleanPath.startsWith("/media/") || cleanPath.startsWith("/api/media/")) {
    return cleanPath;
  }

  return `/media/${cleanPath.replace(/^\/+/, "")}`;
}

export function getMediaURL(path) {
  if (!path) return "/adocao-cachorro.webp";

  if (path.startsWith("http")) {
    try {
      const parsed = new URL(path);
      const isLocalBackend =
        ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
        parsed.port === "8000";

      if (!isLocalBackend) {
        return path;
      }

      const cleanPath = parsed.pathname.startsWith("/")
        ? parsed.pathname
        : `/${parsed.pathname}`;

      return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}${cleanPath}` : cleanPath;
    } catch {
      return path;
    }
  }

  const finalPath = buildMediaPath(path);
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}${finalPath}` : finalPath;
}

export default api;
