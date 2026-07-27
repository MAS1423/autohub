export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Redirect to the login page.
 * Call this from an event handler, never during render.
 */
export const startLogin = (redirectTo?: string) => {
  const target = redirectTo ?? window.location.pathname;
  const loginUrl = target && target !== "/login"
    ? `/login?redirect=${encodeURIComponent(target)}`
    : "/login";
  window.location.href = loginUrl;
};
