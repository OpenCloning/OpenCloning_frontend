const AUTH_INTERCEPTORS_ATTACHED = '__opencloningHttpClientAuthAttached';

let unauthorizedHandler = null;
let tokenGetter = null;

export function setHttpClientUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function setHttpClientTokenGetter(fn) {
  tokenGetter = fn;
}

export function attachAuthInterceptors(client) {
  if (client[AUTH_INTERCEPTORS_ATTACHED]) {
    return client;
  }

  client[AUTH_INTERCEPTORS_ATTACHED] = true;

  client.interceptors.request.use(async (config) => {
    const token = await tokenGetter?.();
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
