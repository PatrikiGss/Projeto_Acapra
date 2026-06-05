export const AUTH_EVENT = "acapra-auth-change";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  return Date.now() >= payload.exp * 1000;
}

export function isLoggedIn() {
  const access = localStorage.getItem("access");
  if (access && !isJwtExpired(access)) {
    return true;
  }

  const refresh = localStorage.getItem("refresh");
  return Boolean(refresh) && !isJwtExpired(refresh);
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession({ access, refresh, user = null }) {
  if (access) {
    localStorage.setItem("access", access);
  }

  if (refresh) {
    localStorage.setItem("refresh", refresh);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function updateStoredUser(user) {
  if (!user) return;

  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAuthChanges(callback) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
