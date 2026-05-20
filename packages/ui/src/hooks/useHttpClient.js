import React from 'react';
import getHttpClient from '@opencloning/utils/getHttpClient';
import { useConfig } from './useConfig';

export default function useHttpClient() {
  const { backendUrl, requiresBackendAuth = false } = useConfig();

  // Memoize the client creation and interceptor setup
  const apiClient = React.useMemo(() => {
    if (!backendUrl) {
      // Return a client without backend URL if config not loaded yet
      return getHttpClient([], { requiresAuth: requiresBackendAuth });
    }
    return getHttpClient([backendUrl], { requiresAuth: requiresBackendAuth });
  }, [backendUrl, requiresBackendAuth]);

  return apiClient;
}
