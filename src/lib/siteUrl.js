export function getSiteRootUrl() {
  const path = window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`;

  return `${window.location.origin}${path}`;
}

export function getAuthRedirectUrl(route) {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;

  return `${getSiteRootUrl()}#${normalizedRoute}`;
}
