import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFingerprint: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch {
    // Fallback: generate a random fingerprint stored in localStorage
    const stored = localStorage.getItem("ps_fp");
    if (stored) {
      cachedFingerprint = stored;
      return stored;
    }
    const fallback = `fp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("ps_fp", fallback);
    cachedFingerprint = fallback;
    return fallback;
  }
}
