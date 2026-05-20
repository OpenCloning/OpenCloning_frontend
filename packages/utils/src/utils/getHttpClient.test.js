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
});
