export function getSafeRedirectPath(candidate: string | null, baseUrl: string) {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f]/.test(candidate)
  ) {
    return "/dashboard";
  }

  const baseOrigin = new URL(baseUrl).origin;
  const destination = new URL(candidate, baseOrigin);
  if (destination.origin !== baseOrigin) return "/dashboard";

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
