const PRODUCTION_SITE_URL = "https://istesport.com";

export function getSiteRootUrl() {
  if (import.meta.env.PROD) {
    return PRODUCTION_SITE_URL;
  }

  return window.location.origin;
}

export function getAuthRedirectUrl(route) {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;

  return `${getSiteRootUrl()}${normalizedRoute}`;
}
