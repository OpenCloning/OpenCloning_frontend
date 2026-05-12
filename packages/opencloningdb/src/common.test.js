import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  baseUrl,
  clearWorkspaceHeader,
  openCloningDBHttpClient,
  setUnauthorizedHandler,
  setWorkspaceHeader,
} from './common';

const requestFulfilled = openCloningDBHttpClient.interceptors.request.handlers[0].fulfilled;
const responseFulfilled = openCloningDBHttpClient.interceptors.response.handlers[0].fulfilled;
const responseRejected = openCloningDBHttpClient.interceptors.response.handlers[0].rejected;

beforeEach(() => {
  localStorage.clear();
  clearWorkspaceHeader();
  setUnauthorizedHandler(null);
});

afterEach(() => {
  localStorage.clear();
  clearWorkspaceHeader();
  setUnauthorizedHandler(null);
});

describe('common', () => {
  it('exports the expected base URL', () => {
    expect(baseUrl).toBe('http://localhost:8001');
  });

  it('sets and clears the workspace header', () => {
    setWorkspaceHeader(12);

    expect(openCloningDBHttpClient.defaults.headers.common['X-Workspace-Id']).toBe(12);

    clearWorkspaceHeader();

    expect(openCloningDBHttpClient.defaults.headers.common['X-Workspace-Id']).toBeUndefined();
  });

  it('serializes scalars and arrays while skipping nullish values', () => {
    const serialized = openCloningDBHttpClient.defaults.paramsSerializer({
      single: 'value',
      number: 3,
      ignored: undefined,
      ignoredToo: null,
      list: ['a', undefined, 'b', null, 4],
    });

    expect(serialized).toBe('single=value&number=3&list=a&list=b&list=4');
  });

  it('returns an empty query string when params are missing', () => {
    expect(openCloningDBHttpClient.defaults.paramsSerializer()).toBe('');
  });

  it('adds the bearer token to request headers when present', () => {
    localStorage.setItem('token', '__TEST_TOKEN__');
    const config = { headers: {} };

    const result = requestFulfilled(config);

    expect(result).toBe(config);
    expect(config.headers.Authorization).toBe('Bearer __TEST_TOKEN__');
  });

  it('leaves request headers unchanged when there is no token', () => {
    const config = { headers: {} };

    const result = requestFulfilled(config);

    expect(result).toBe(config);
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('passes successful responses through unchanged', () => {
    const response = { data: { ok: true } };

    expect(responseFulfilled(response)).toBe(response);
  });

  it('calls the unauthorized handler for 401 responses', async () => {
    const handler = vi.fn();
    const error = { response: { status: 401 } };
    setUnauthorizedHandler(handler);

    await expect(responseRejected(error)).rejects.toBe(error);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call the unauthorized handler for non-401 responses', async () => {
    const handler = vi.fn();
    const error = { response: { status: 500 } };
    setUnauthorizedHandler(handler);

    await expect(responseRejected(error)).rejects.toBe(error);

    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects 401 responses even when no unauthorized handler is set', async () => {
    const error = { response: { status: 401 } };

    await expect(responseRejected(error)).rejects.toBe(error);
  });
});
