import React from 'react';
import { Alert, FormControl, InputAdornment, TextField } from '@mui/material';
import { shallowEqual, useSelector } from 'react-redux';
import { isEqual } from 'lodash-es';
import { getInputSequencesFromSourceId } from '@opencloning/store/cloning_utils';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

// The annotation tool is chosen in the source type selector, not here
function SourceAnnotation({ source, requestStatus, sendPostRequest }) {
  const inputSequences = useSelector((state) => getInputSequencesFromSourceId(state, source.id), isEqual);
  const primers = useSelector((state) => state.cloning.primers, shallowEqual);
  // The same settings used elsewhere for melting temperatures, editable in the Settings tab
  const globalPrimerSettings = useSelector((state) => state.cloning.globalPrimerSettings, isEqual);

  const minimalAnnealingRef = React.useRef(null);
  const allowedMismatchesRef = React.useRef(null);
  const minimalTmRef = React.useRef(null);

  const annotationTool = source.annotation_tool || 'plannotate';
  const isMapPrimers = annotationTool === 'primer_binding_sites';

  const onSubmit = (event) => {
    event.preventDefault();

    const requestData = {
      sequence: inputSequences[0],
      source: { id: source.id, input: inputSequences.map((e) => ({ sequence: e.id })), annotation_tool: annotationTool },
    };

    if (isMapPrimers) {
      requestData.primers = primers;
      requestData.settings = globalPrimerSettings;
      const params = {
        minimal_annealing: minimalAnnealingRef.current.value,
        allowed_mismatches: allowedMismatchesRef.current.value,
      };
      // Left empty means no filtering, rather than a minimum of zero
      if (minimalTmRef.current.value !== '') {
        params.minimal_tm = minimalTmRef.current.value;
      }
      sendPostRequest({ endpoint: 'annotate/primer_binding_sites', requestData, config: { params }, source });
    } else {
      sendPostRequest({ endpoint: 'annotate/plannotate', requestData, source });
    }
  };

  if (isMapPrimers && primers.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Add primers in the Primers tab to map them onto this sequence.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {isMapPrimers && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            {`All ${primers.length} primer${primers.length === 1 ? '' : 's'} in the Primers tab will be mapped onto this sequence.`}
          </Alert>
          <FormControl fullWidth>
            <TextField
              label="Minimal annealing length"
              inputRef={minimalAnnealingRef}
              type="number"
              defaultValue={14}
              InputProps={{
                endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                sx: { '& input': { textAlign: 'center' } },
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              label="Mismatches allowed"
              inputRef={allowedMismatchesRef}
              type="number"
              defaultValue={0}
              InputProps={{
                sx: { '& input': { textAlign: 'center' } },
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              label="Minimal Tm"
              inputRef={minimalTmRef}
              type="number"
              defaultValue=""
              helperText="Leave empty to keep every binding site"
              InputProps={{
                endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                sx: { '& input': { textAlign: 'center' } },
              }}
            />
          </FormControl>
        </>
      )}
      <SubmitButtonBackendAPI
        requestStatus={requestStatus}
        {...(import.meta.env.VITE_UMAMI_WEBSITE_ID && { "data-umami-event": "submit-annotation" })}
      >
        {isMapPrimers ? 'Map primers' : 'Annotate'}
      </SubmitButtonBackendAPI>
    </form>
  );
}

export default React.memo(SourceAnnotation);
