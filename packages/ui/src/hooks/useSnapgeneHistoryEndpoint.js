import React from 'react';
import useCloningHistoryLoader from './useCloningHistoryLoader';

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
  const { loadSnapgeneHistory: loadSnapgeneHistoryCore } = useCloningHistoryLoader();

  const loadSnapgeneHistory = React.useCallback(async (file, sourceIdToDelete = null) => (
    loadSnapgeneHistoryCore(file, { sourceIdToDelete })
  ), [loadSnapgeneHistoryCore]);

  return { loadSnapgeneHistory };
}
