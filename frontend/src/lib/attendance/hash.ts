/**
 * Computes a hash for duplicate file detection in attendance imports.
 * Gracefully handles insecure contexts (HTTP over LAN IP) where
 * crypto.subtle is undefined in browsers.
 */
export async function computeFileHash(
  buffer: ArrayBuffer,
  cryptoObj?: { subtle?: { digest?: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> } }
): Promise<string> {
  const activeCrypto = cryptoObj !== undefined ? cryptoObj : (typeof crypto !== "undefined" ? crypto : undefined);

  if (activeCrypto?.subtle?.digest) {
    try {
      const hashBuffer = await activeCrypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Fall through to fallback
    }
  }

  // Pure JS fallback (FNV-1a 64-bit variant with length prefix)
  const bytes = new Uint8Array(buffer);
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 0x01000193);
    h2 = Math.imul(h2 ^ bytes[i], 0x85ebca6b);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const lenHex = bytes.length.toString(16).padStart(8, "0");
  return `hash-${lenHex}-${hex1}${hex2}`;
}
