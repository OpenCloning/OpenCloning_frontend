import React from 'react';
import useBackendRoute from './useBackendRoute';
import useHttpClient from './useHttpClient';
import useCloningAlerts from './useCloningAlerts';
import { batch, useDispatch, useStore } from 'react-redux';
import { mergeStates } from '@opencloning/utils/network';
import { cloningActions } from '@opencloning/store/cloning';

const { setState: setCloningState, deleteSourceAndItsChildren } = cloningActions;


/**
 * Custom React hook that provides a function to load and process a SnapGene .dna file's cloning history
 * via the backend endpoint. If successful, updates the Redux cloning state (merging or replacing as appropriate)
 * and handles warnings. On failure, triggers a user alert.
 *
 * @returns {Object} An object with a single method `loadSnapgeneHistory(file)`:
 *   - {Promise<boolean>} loadSnapgeneHistory(file): Attempt to load and merge/replace SnapGene history.
 *     Returns true on successfully parsing the SnapGene file, otherwise returns false and triggers a warning alert.
 */
export default function useSnapgeneHistoryEndpoint() {
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const { addAlert } = useCloningAlerts();
  const dispatch = useDispatch();
  const store = useStore();
  const url = backendRoute('read_snapgene_history');

  const loadSnapgeneHistory = React.useCallback(async (file, sourceIdToDelete = null) => {
    const cloningState = store.getState().cloning;
    const formData = new FormData();
    formData.append('file', file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    // If it fails to parse the history return false, true otherwise
    try {
      const resp = await httpClient.post(url, formData, config);
      const { data: cloningStrategy } = resp;
      let mergedState;
      if (!(cloningState.sources.length === 1 && cloningState.sources[0].type === null)) {
        ({ mergedState } = mergeStates(cloningStrategy, cloningState));
      } else {
        // If there is only one source and it is empty, replace the whole state
        mergedState = cloningStrategy;
      }
      if (resp.headers['x-warning']) {
        addAlert({
          message: `SnapGene parsing warning: ${resp.headers['x-warning']}`,
          severity: 'warning',
        });
      }
      batch(() => {
        dispatch(setCloningState(mergedState));
        if (sourceIdToDelete !== null) {
          console.log('deleting source', sourceIdToDelete);
          dispatch(deleteSourceAndItsChildren(sourceIdToDelete));
        }
      });
      return true;
    } catch {
      addAlert({
        message: 'Failed to parse the history from the SnapGene file, will only read the sequence.',
        severity: 'warning',
      });
      return false;
    }
  }, [httpClient, addAlert, dispatch, store, url]);
  return { loadSnapgeneHistory };
}
