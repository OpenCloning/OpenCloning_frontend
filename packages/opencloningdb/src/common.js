import axios from 'axios';
import { attachAuthInterceptors, setHttpClientUnauthorizedHandler } from '@opencloning/utils/httpClientAuth';


export const baseUrl = `${import.meta.env?.VITE_OPENCLONING_DB_BACKEND || 'http://localhost:8000'}/db`;

export const setUnauthorizedHandler = setHttpClientUnauthorizedHandler;

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

attachAuthInterceptors(openCloningDBHttpClient);
