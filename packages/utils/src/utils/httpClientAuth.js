const AUTH_INTERCEPTORS_ATTACHED = '__opencloningHttpClientAuthAttached';

let unauthorizedHandler = null;

export function setHttpClientUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function attachAuthInterceptors(client, { tokenStorageKey = 'token' } = {}) {
  if (client[AUTH_INTERCEPTORS_ATTACHED]) {
    return client;
  }

  client[AUTH_INTERCEPTORS_ATTACHED] = true;

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenStorageKey);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }
      return Promise.reject(error);
    },
  );

  return client;
}
