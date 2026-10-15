import { describe, expect, it } from 'vitest';

import { urlMatchesPrefix } from './urlUtils';

describe('urlMatchesPrefix', () => {
  it('matches urls under the prefix', () => {
    expect(urlMatchesPrefix('https://example.com/a/b', 'https://example.com/a')).toBe(true);
    expect(urlMatchesPrefix('https://example.com/a', 'https://example.com/a')).toBe(true);
    expect(urlMatchesPrefix('https://example.com/a?x=1', 'https://example.com/a')).toBe(true);
    expect(urlMatchesPrefix('https://example.com/a/b', 'https://example.com')).toBe(true);
    expect(urlMatchesPrefix('https://example.com/esearch.fcgi?db=x', 'https://example.com/esearch.fcgi')).toBe(true);
  });

  it('does not match lookalike hosts or paths', () => {
    expect(urlMatchesPrefix('https://example.com.evil.org/a', 'https://example.com')).toBe(false);
    expect(urlMatchesPrefix('https://example.com@evil.org/a', 'https://example.com')).toBe(false);
    expect(urlMatchesPrefix('https://exampleXcom/a', 'https://example.com')).toBe(false);
    expect(urlMatchesPrefix('https://other.com/https://example.com/a', 'https://example.com/a')).toBe(false);
  });

  it('resolves relative urls and prefixes against the current origin', () => {
    const { origin } = window.location;
    expect(urlMatchesPrefix('/backend/db/sequences', '/backend/db')).toBe(true);
    expect(urlMatchesPrefix(`${origin}/backend/db/sequences`, '/backend/db')).toBe(true);
    expect(urlMatchesPrefix('https://evil.org/backend/db/sequences', '/backend/db')).toBe(false);
  });
});
