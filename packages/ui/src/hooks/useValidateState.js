import React from 'react';
import useCloningAlerts from './useCloningAlerts';
import useBackendRoute from './useBackendRoute';
import useHttpClient from './useHttpClient';

export default function useValidateState() {
  const backendRoute = useBackendRoute();
  const { addAlert } = useCloningAlerts();
  const httpClient = useHttpClient();

  const validateState = React.useCallback(async (newState) => {
    // Returns null if the state is valid, otherwise the new updated state
    // It also adds alerts
    try {
      const response = await httpClient.post(backendRoute('validate'), newState);
      if (response.data !== null) {
        response.headers['x-warning'].split(';').forEach((warning) => {
          addAlert({
            message: warning,
            severity: 'warning',
          });
        });
      }
      // Either return the updated state or the original state if it was valid
      return response.data || newState;
    } catch (e) {
      if (e.code === 'ERR_NETWORK') {
        addAlert({
          message: 'Cannot connect to backend server to validate the JSON file',
          severity: 'error',
        });
      } else {
        addAlert({
          message: 'Cloning strategy could be loaded, but it is not valid',
          severity: 'warning',
        });
      }
      return newState;
    }
  }, [addAlert, backendRoute, httpClient]);

  return validateState;
}
