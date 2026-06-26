export type ExpirationStatus = "fresh" | "expiring_soon" | "expired";

/**
 * Compute expiration status from an ISO 8601 timestamp.
 * - null / undefined → fresh (no expiration set)
 * - past → expired
 * - within 3 days → expiring_soon
 * - more than 3 days out → fresh
 */
export function getExpirationStatus(expiresAt: string | null): ExpirationStatus {
  if (expiresAt === null) return "fresh";
  const diffDays = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "expiring_soon";
  return "fresh";
}
