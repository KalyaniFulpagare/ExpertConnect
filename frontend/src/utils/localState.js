const safeRead = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage failures so the app still works in restricted browsers.
  }
};

export const loadFavorites = () => safeRead("atlas-favorites", []);

export const toggleFavoriteId = (expertId) => {
  const current = new Set(loadFavorites());

  if (current.has(expertId)) {
    current.delete(expertId);
  } else {
    current.add(expertId);
  }

  const next = Array.from(current);
  safeWrite("atlas-favorites", next);
  return next;
};

export const loadBookingProfile = () =>
  safeRead("atlas-booking-profile", {
    name: "",
    email: "",
    phone: ""
  });

export const saveBookingProfile = (profile) => {
  safeWrite("atlas-booking-profile", profile);
};

export const loadRecentExperts = () => safeRead("atlas-recent-experts", []);

export const pushRecentExpert = (expert) => {
  const current = loadRecentExperts().filter((item) => item._id !== expert._id);
  const next = [expert, ...current].slice(0, 5);
  safeWrite("atlas-recent-experts", next);
  return next;
};
