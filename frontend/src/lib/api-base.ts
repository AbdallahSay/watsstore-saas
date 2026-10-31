export const PRODUCTION_API_URL = 'https://watsstore.runasp.net/api';

export function resolveApiBaseUrl(configured?: string): string {
  const value = configured?.trim() || PRODUCTION_API_URL;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid public API URL configuration');
  }
  return value.replace(/\/+$/, '');
}

// Both catalog and commerce must use the same build-time configuration and fallback.
export const API_BASE_URL = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
