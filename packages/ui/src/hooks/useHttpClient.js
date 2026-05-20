import React from 'react';
import getHttpClient, { getAuthenticatedHttpClient } from '@opencloning/utils/getHttpClient';
import { useConfig } from './useConfig';

export default function useHttpClient() {
  const { backendUrl, requiresBackendAuth = false } = useConfig();

  // Memoize the client creation and interceptor setup
  const apiClient = React.useMemo(() => {
    const createHttpClient = requiresBackendAuth ? getAuthenticatedHttpClient : getHttpClient;

    if (!backendUrl) {
      // Return a client without backend URL if config not loaded yet
      return createHttpClient([]);
    }
    return createHttpClient([backendUrl]);
  }, [backendUrl, requiresBackendAuth]);

  return apiClient;
}
