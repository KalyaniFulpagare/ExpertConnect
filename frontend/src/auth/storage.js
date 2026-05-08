const TOKEN_KEY = "expert-session-auth-token";
const USER_KEY = "expert-session-auth-user";

const safeRead = (key, fallback) => {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so auth still works in restricted browsers.
  }
};

const safeRemove = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so logout never crashes the UI.
  }
};

export const getStoredToken = () => safeRead(TOKEN_KEY, "");

export const getStoredUser = () => {
  const raw = safeRead(USER_KEY, "");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredSession = ({ token, user }) => {
  safeWrite(TOKEN_KEY, token);
  safeWrite(USER_KEY, JSON.stringify(user));
};

export const clearStoredSession = () => {
  safeRemove(TOKEN_KEY);
  safeRemove(USER_KEY);
};
