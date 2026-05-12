import axios from 'axios';

export const baseUrl = 'http://localhost:8001';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function setWorkspaceHeader(id) {
  openCloningDBHttpClient.defaults.headers.common['X-Workspace-Id'] = id;
}

export function clearWorkspaceHeader() {
  delete openCloningDBHttpClient.defaults.headers.common['X-Workspace-Id'];
}

export const openCloningDBHttpClient = axios.create({
  baseURL: baseUrl,
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) {
            searchParams.append(key, String(v));
          }
        });
      } else {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  },
});

openCloningDBHttpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

openCloningDBHttpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);
