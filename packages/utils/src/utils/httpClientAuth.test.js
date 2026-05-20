import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { attachAuthInterceptors, setHttpClientUnauthorizedHandler } from './httpClientAuth';

describe('httpClientAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    setHttpClientUnauthorizedHandler(null);
  });

  afterEach(() => {
    localStorage.clear();
    setHttpClientUnauthorizedHandler(null);
  });

  it('adds the bearer token to authenticated requests', () => {
    const client = attachAuthInterceptors(axios.create());
    const requestFulfilled = client.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };

    localStorage.setItem('token', '__TEST_TOKEN__');

    const result = requestFulfilled(config);

    expect(result).toBe(config);
    expect(config.headers.Authorization).toBe('Bearer __TEST_TOKEN__');
  });

  it('calls the shared unauthorized handler for 401 responses', async () => {
    const client = attachAuthInterceptors(axios.create());
    const responseRejected = client.interceptors.response.handlers[0].rejected;
    const handler = vi.fn();
    const error = { response: { status: 401 } };

    setHttpClientUnauthorizedHandler(handler);

    await expect(responseRejected(error)).rejects.toBe(error);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not attach duplicate interceptors to the same client', () => {
    const client = axios.create();

    attachAuthInterceptors(client);
    attachAuthInterceptors(client);

    expect(client.interceptors.request.handlers.filter(Boolean)).toHaveLength(1);
    expect(client.interceptors.response.handlers.filter(Boolean)).toHaveLength(1);
  });
});
