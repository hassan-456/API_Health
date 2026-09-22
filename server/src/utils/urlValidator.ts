/**
 * Validates a URL for safe health checking.
 * Rejects non-HTTP protocols and private/internal addresses.
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Block obviously private/internal addresses
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./,
      /^\[::1\]$/,
      /^\[fc/,
      /^\[fd/,
      /^\[fe80/,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private or internal addresses are not allowed' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};
