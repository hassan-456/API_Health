/**
 * Determines if an HTTP status code indicates success.
 * 2xx status codes are considered successful.
 */
export const isSuccessStatus = (status: number): boolean => {
  return status >= 200 && status < 300;
};

/**
 * Returns a human-readable status category.
 */
export const getStatusCategory = (status: number): string => {
  if (status >= 200 && status < 300) return 'Success';
  if (status >= 300 && status < 400) return 'Redirect';
  if (status >= 400 && status < 500) return 'Client Error';
  if (status >= 500) return 'Server Error';
  return 'Unknown';
};
