import crypto from "crypto";

/**
 * Hash an IP address using SHA-256 for privacy-preserving storage.
 */
export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}
