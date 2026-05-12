import { useState, useCallback } from 'react';
import error2String from '@opencloning/utils/error2String';
import useBackendRoute from './useBackendRoute';
import useCloningAlerts from './useCloningAlerts';
import useHttpClient from './useHttpClient';

export default function useBackendAPI() {
  const [requestStatus, setRequestStatus] = useState({ status: null, message: '' });
  const [sources, setSources] = useState([]);
  const [sequences, setSequences] = useState([]);
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const { addAlert } = useCloningAlerts();

  const sendPostRequest = useCallback(async ({ endpoint, requestData, config = {}, source: { output }, modifySource = (s) => s }) => {
    setRequestStatus({ status: 'loading', message: 'loading' });

    // Url built like this in case trailing slash
    const url = backendRoute(endpoint);
    // paramsSerializer: { indexes: null } is to correctly serialize arrays in the URL
    const fullConfig = { ...config, paramsSerializer: { indexes: null } };
    try {
      const resp = await httpClient.post(url, requestData, fullConfig);
      if (resp.headers['x-warning']) {
        addAlert({ message: resp.headers['x-warning'], severity: 'warning' });
      }

      // Most endpoints return an error if no products would be created,
      // but just in case, we check if response is empty and generate an error
      // TODO: Unit test here
      if (resp.data.sources.length === 0) {
        setSources([]);
        setSequences([]);
        setRequestStatus({ status: 'error', message: 'No outputs returned' });
        return;
      }

      setRequestStatus({ status: null, message: '' });

      const receivedSources = resp.data.sources.map(modifySource);

      setSources(receivedSources); setSequences(resp.data.sequences);
    } catch (error) {
      if (error.response && error.response.headers && error.response.headers['x-warning']) {
        addAlert({ message: error.response.headers['x-warning'], severity: 'warning' });
      }
      setRequestStatus({ status: 'error', message: error2String(error) });
      setSources([]);
      setSequences([]);
    }
  }, []);

  return { requestStatus, sources, sequences, sendPostRequest };
}
