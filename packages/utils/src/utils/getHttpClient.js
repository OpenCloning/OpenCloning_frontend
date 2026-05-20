import axios from 'axios';
import { attachAuthInterceptors } from './httpClientAuth';
import urlWhitelist from '../config/urlWhitelist';

export default function getHttpClient(extraUrls = [], { requiresAuth = false } = {}) {
  const baseURL = import.meta.env.BASE_URL || null;
  const whitelist = [...urlWhitelist, window.location.origin, ...extraUrls];
  if (baseURL) {
    whitelist.push(baseURL);
  }

  const client = axios.create();

  if (requiresAuth) {
    attachAuthInterceptors(client);
  }

  client.interceptors.request.use((config) => {
    const url = new URL(config.url, config.baseURL || window.location.origin);

    if (!whitelist.some((whitelistedUrl) => url.href.match(new RegExp(`^${whitelistedUrl}`)))) {
      return Promise.reject(new Error(`Request blocked: URL not in whitelist ${url.href}`));
    }

    return config;
  }, (error) => Promise.reject(error));

  return client;
}
