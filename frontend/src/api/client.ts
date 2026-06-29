// Set EXPO_PUBLIC_API_URL in frontend/.env.local for device testing.
// The localhost fallback only works in the iOS/Android simulator, not on a real device.
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
