export const AUTH_EVENT = "acapra-auth-change";

export function isLoggedIn() {
  return Boolean(localStorage.getItem("access"));
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
