export function readAdminCache<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeAdminCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing; live data still works.
  }
}
