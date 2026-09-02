export async function fetchAdminJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const text = await response.text();
  let body: (T & { error?: string; detail?: string }) | null = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Admin API returned an invalid response (${response.status})`);
  }

  if (!response.ok || !body) {
    throw new Error(body?.detail || body?.error || "Unable to load admin data");
  }

  return body;
}
