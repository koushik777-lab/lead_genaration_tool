// Small, hook-free navigation helper for wouter.
// Using `window.location.href` forces a full page reload (and can cause loops).
export function navigateTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.history.pushState(null, "", path);
  // wouter listens to `popstate` to update routes
  window.dispatchEvent(new PopStateEvent("popstate"));
}

