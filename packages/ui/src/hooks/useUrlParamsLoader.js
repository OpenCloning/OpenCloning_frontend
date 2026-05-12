import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import useDatabase from './useDatabase';
import useLoadDatabaseFile from './useLoadDatabaseFile';
import useCloningAlerts from './useCloningAlerts';
import useHttpClient from './useHttpClient';
import useValidateState from './useValidateState';
import { formatSequenceLocationString, getUrlParameters } from '@opencloning/utils/other';
import { formatTemplate, loadHistoryFile, loadFilesToSessionStorage } from '@opencloning/utils/readNwrite';

const { setState: setCloningState, updateSource } = cloningActions;

/**
 * Hook to load sequences from URL parameters
 * Handles various source types: database, example, template, genome_coordinates, locus_tag
 */
export default function useUrlParamsLoader() {
  const dispatch = useDispatch();
  const database = useDatabase();
  const { addAlert } = useCloningAlerts();
  const setHistoryFileError = (e) => addAlert({ message: e, severity: 'error' });
  const { loadDatabaseFile } = useLoadDatabaseFile({ source: { id: 1 }, sendPostRequest: null, setHistoryFileError });
  const validateState = useValidateState();
  const httpClient = useHttpClient();

  useEffect(() => {
    async function loadSequenceFromUrlParams() {
      const urlParams = getUrlParameters();

      if (urlParams.source === 'database') {
        try {
          if (!database) {
            return;
          }
          const { file, databaseId } = await database.loadSequenceFromUrlParams(urlParams);
          loadDatabaseFile(file, databaseId);
        } catch (error) {
          addAlert({
            message: 'Error loading sequence from URL parameters',
            severity: 'error',
          });
          console.error(error);
        }
      } else if (urlParams.source === 'example' && urlParams.example) {
        try {
          const url = `${import.meta.env.BASE_URL}examples/${urlParams.example}`;
          let data;
          if (urlParams.example.endsWith('.zip')) {
            // For zip files, get as blob and process with loadHistoryFile
            const { data: blob } = await httpClient.get(url, { responseType: 'blob' });
            const fileName = urlParams.example;
            // eslint-disable-next-line no-undef
            const file = new File([blob], fileName);
            const { cloningStrategy, verificationFiles } = await loadHistoryFile(file);
            data = await validateState(cloningStrategy);
            await loadFilesToSessionStorage(verificationFiles, 0);
          } else {
            // For JSON files, get as JSON
            const { data: jsonData } = await httpClient.get(url);
            data = await validateState(jsonData);
          }
          dispatch(setCloningState(data));
        } catch (error) {
          addAlert({
            message: 'Error loading example',
            severity: 'error',
          });
          console.error(error);
        }
      } else if (urlParams.source === 'template' && urlParams.template && urlParams.key) {
        try {
          const baseUrl = 'https://assets.opencloning.org/OpenCloning-submission';
          const url = `${baseUrl}/processed/${urlParams.key}/templates/${urlParams.template}`;
          const { data } = await httpClient.get(url);
          const validatedData = await validateState(data);
          const newState = formatTemplate(validatedData, url);

          dispatch(setCloningState(newState));
        } catch (error) {
          addAlert({
            message: 'Error loading template',
            severity: 'error',
          });
          console.error(error);
        }
      } else if (urlParams.source === 'genome_coordinates') {
        const { sequence_accession, start, end, strand, assembly_accession } = urlParams;
        if (!sequence_accession || !start || !end || !strand) {
          addAlert({
            message: 'Error loading genome sequence from URL parameters',
            severity: 'error',
          });
          return;
        }
        const startNum = Number(start);
        const endNum = Number(end);
        const strandNum = Number(strand);
        let error = '';
        if (isNaN(startNum) || isNaN(endNum)) {
          error = 'Start and end must be numbers';
        }
        else if (![1, -1].includes(strandNum)) {
          error = 'Strand must be 1 or -1';
        }
        else if (startNum < 1) {
          error = 'Start must be greater than zero';
        }
        else if (startNum >= endNum) {
          error = 'End must be greater than start';
        }
        if (error) {
          addAlert({ message: `Error loading genome coordinates from URL parameters: ${error}`, severity: 'error' });
          return;
        }

        const source = {
          id: 1,
          type: 'KnownGenomeCoordinatesSource',
          assembly_accession,
          repository_id: sequence_accession,
          coordinates: formatSequenceLocationString(start, end, strand),
        }
        dispatch(updateSource(source));
      } else if (urlParams.source === 'locus_tag') {
        const { locus_tag, assembly_accession, padding } = urlParams;
        if (!locus_tag || !assembly_accession) {
          addAlert({
            message: 'Error loading locus tag from URL parameters',
            severity: 'error',
          });
          return;
        }

        const source = {
          id: 1,
          type: 'KnownGenomeCoordinatesSource',
          assembly_accession,
          locus_tag,
          padding: padding ? Number(padding) : 1000,
        }
        dispatch(updateSource(source));
      }
    }
    loadSequenceFromUrlParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

