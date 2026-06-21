/**
 * Crypto utilities with fallbacks for older browsers
 */

/**
 * Generate a UUID v4 with fallback for older browsers
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID first (available in modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback implementation for older browsers
  // Uses Math.random() which is not cryptographically secure,
  // but acceptable for device IDs (not security-critical)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
