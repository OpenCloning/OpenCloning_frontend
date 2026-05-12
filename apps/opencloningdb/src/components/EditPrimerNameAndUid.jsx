import React from 'react';
import { Box, Button, CircularProgress, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';

import useAppAlerts from '../hooks/useAppAlerts';

function EditPrimerNameAndUid({ primer, onSave }) {
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();

  const primerId = primer.id;

  const [name, setName] = React.useState(primer.name ?? '');
  const [uid, setUid] = React.useState(primer.uid ?? '');

  React.useEffect(() => {
    setName(primer.name ?? '');
    setUid(primer.uid ?? '');
  }, [primer]);

  const nameTrimmed = name.trim();
  const uidTrimmed = uid.trim();
  const prevUid = primer.uid ?? '';

  const nameValid = nameTrimmed.length >= 2;
  const submissionAllowed = nameValid;

  const patchMutation = useMutation({
    mutationFn: async (payload) => openCloningDBHttpClient.patch(endpoints.primer(primerId), payload),
    onSuccess: () => {
      addAlert({ message: 'Primer updated successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['primer', String(primerId)] });
      queryClient.invalidateQueries({ queryKey: ['primers'] });
      onSave();
    },
    onError: (error) => {
      addAlert({
        message: error?.response?.data?.detail || error?.message || 'Error updating primer',
        severity: 'error',
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionAllowed) return;

    const payload = {};
    if (nameTrimmed !== (primer.name ?? '')) {
      payload.name = nameTrimmed;
    }
    if (uidTrimmed === '' && prevUid !== '') {
      payload.uid = '';
    } else if (uidTrimmed !== '' && uidTrimmed !== prevUid) {
      payload.uid = uidTrimmed;
    }

    if (Object.keys(payload).length === 0) {
      onSave();
      return;
    }

    patchMutation.mutate(payload);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    >
      <TextField
        size="small"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!nameValid}
        helperText={!nameValid ? 'Name must be at least 2 characters' : " "}
        sx={{ minWidth: 220 }}
      />

      <TextField
        size="small"
        label="UID"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        placeholder="Optional"
        helperText="Leave empty to clear"
        sx={{ minWidth: 200, '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
      />

      <Button
        type="submit"
        variant="contained"
        size="small"
        disabled={!submissionAllowed || patchMutation.isPending}
        startIcon={patchMutation.isPending ? <CircularProgress size={16} /> : null}
        sx={{ mb: 3}}
      >
        {patchMutation.isPending ? 'Submitting' : 'Save'}
      </Button>
      <Button variant="text" color="error" onClick={() => onSave()} sx={{ mb: 3}}>
        Cancel
      </Button>
    </Box>
  );
}

export default EditPrimerNameAndUid;
