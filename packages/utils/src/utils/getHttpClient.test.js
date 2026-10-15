import { describe, expect, it } from 'vitest';

import getHttpClient, { getAuthenticatedHttpClient } from './getHttpClient';

describe('getHttpClient', () => {
  it('creates a generic client without auth interceptors', () => {
    const client = getHttpClient();

    expect(client.interceptors.request.handlers.filter(Boolean)).toHaveLength(1);
    expect(client.interceptors.response.handlers.filter(Boolean)).toHaveLength(0);
  });

  it('creates an authenticated client with auth interceptors', () => {
    const client = getAuthenticatedHttpClient();

    expect(client.interceptors.request.handlers.filter(Boolean)).toHaveLength(2);
    expect(client.interceptors.response.handlers.filter(Boolean)).toHaveLength(1);
  });

  it('blocks urls that only look like whitelisted ones', async () => {
    const client = getHttpClient(['https://backend.example.org']);
    const requestFulfilled = client.interceptors.request.handlers[0].fulfilled;

    const allowed = { url: 'https://backend.example.org/version' };
    expect(await requestFulfilled(allowed)).toBe(allowed);

    for (const url of [
      'https://backend.example.org.evil.org/version',
      'https://backend.example.org@evil.org/version',
      'https://assets-opencloning.org/OpenCloning-submission/index.json',
    ]) {
      await expect(requestFulfilled({ url })).rejects.toThrow('Request blocked');
    }
  });
});
