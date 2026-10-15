/**
 * Whether `url` starts with `prefix`, comparing the normalized urls (relative urls are
 * resolved against the current origin). Normalizing makes a host-only prefix end in "/",
 * so https://example.com matches https://example.com/path but not
 * https://example.com.evil.org or https://example.com@evil.org.
 */
export function urlMatchesPrefix(url, prefix) {
  return new URL(url, window.location.origin).href.startsWith(new URL(prefix, window.location.origin).href);
}
