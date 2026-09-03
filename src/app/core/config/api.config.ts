const localApiUrl = 'http://127.0.0.1:3000';

declare global {
  interface Window {
    __FITADMIN_API_URL__?: string;
  }
}

export function apiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return localApiUrl;
  }

  const configuredUrl = window.__FITADMIN_API_URL__?.trim();
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localApiUrl;
  }

  const rootDomain = hostname.replace(/^www\./, '');
  return `${window.location.protocol}//api.${rootDomain}`;
}

export function isApiUrl(url: string): boolean {
  return url.startsWith(apiBaseUrl()) || url.startsWith(localApiUrl) || url.startsWith('http://localhost:3000');
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}
