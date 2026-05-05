import React from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  CircularProgress,
  Modal,
  TableContainer,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { delimitedFileToJson } from '@opencloning/utils/fileParsers';
import useAppAlerts from '../../hooks/useAppAlerts';
import PrimerBulkUploadPreviewTable from './PrimerBulkUploadPreviewTable';
import { getPrimerRowsInfo, normalizePrimerSubmission } from '../../utils/bulk_upload';


export default function BulkUploadPrimersButton() {
  const hiddenFileInput = React.useRef(null);
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();
  const workspaceRole = useSelector((state) => state.auth.workspace?.role);
  const [openModal, setOpenModal] = React.useState(false);
  const [validationRows, setValidationRows] = React.useState([]);

  const validateMutation = useMutation({
    mutationFn: async (primers) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.primersValidateUpload, primers);
      return data;
    },
    onError: (error) => {
      addAlert({
        message: String(error?.response?.data?.detail) || String(error?.message) || 'Failed to validate primers',
        severity: 'error',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ primers, modeLabel }) => {
      const strict = modeLabel === 'clear';
      const { data } = await openCloningDBHttpClient.post(endpoints.primersBulk, primers, { params: { strict } });
      return data;
    },
    onSuccess: (createdPrimers, variables) => {
      addAlert({
        message: `Imported ${createdPrimers.length} ${variables.modeLabel} primer${createdPrimers.length === 1 ? '' : 's'} successfully`,
        severity: 'success',
      });
      setOpenModal(false);
      setValidationRows([]);
      queryClient.invalidateQueries({ queryKey: ['primers'] });
    },
    onError: (error) => {
      const conflictRows = error?.response?.status === 409 ? error?.response?.data : null;
      if (Array.isArray(conflictRows)) {
        setValidationRows(conflictRows);
        addAlert({
          message: 'Conflicts detected while importing. Review the updated validation results.',
          severity: 'warning',
        });
        return;
      }
      addAlert({
        message: 'Server error while importing primers',
        severity: 'error',
      });
    },
  });

  const { orderedRows, clearRows, clearAndWarningRows, warningRowsCount, errorRowsCount } = React.useMemo(
    () => getPrimerRowsInfo(validationRows),
    [validationRows]);


  const handleUploadClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileUpload = async (event) => {
    const fileUploaded = event.target.files?.[0];
    if (!fileUploaded) {
      return;
    }

    try {
      const parsed = await delimitedFileToJson(fileUploaded, ['name', 'sequence', 'uid'], true);
      const normalizedRows = parsed.map(normalizePrimerSubmission);
      if (normalizedRows.length < 1) {
        throw new Error('File does not contain primer rows');
      }
      const rows = await validateMutation.mutateAsync(normalizedRows);
      setValidationRows(rows);
      setOpenModal(true);
    } catch (error) {
      addAlert({
        message: error?.response?.data?.detail || error?.message || 'Failed to parse or validate primers file',
        severity: 'error',
      });
    } finally {
      event.target.value = null;
    }
  };

  const handleSubmit = (primers, modeLabel) => {
    if (primers.length < 1) {
      return;
    }
    const primers2submit = primers.map(({name, sequence, uid}) => ({name, sequence, uid}));
    submitMutation.mutate({ primers: primers2submit, modeLabel });
  };

  if (workspaceRole === 'viewer') {
    return null;
  }

  return (
    <>
      <Tooltip
        arrow
        title={(
          <span style={{ fontSize: '1.2em' }}>
            Upload a .csv or .tsv file with headers name, sequence, uid
          </span>
        )}
      >
        <Button onClick={handleUploadClick} data-testid="bulk-upload-primers-button">
          Bulk Upload Primers
        </Button>
      </Tooltip>

      <input
        style={{ display: 'none' }}
        type="file"
        accept=".csv,.tsv"
        ref={hiddenFileInput}
        onChange={handleFileUpload}
      />

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          data-testid="bulk-upload-primers-modal"
          sx={{
            bgcolor: 'background.paper',
            p: 3,
            width: 'min(1280px, 98vw)',
            maxHeight: '90vh',
            overflow: 'hidden',
            mx: 'auto',
            my: '5vh',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
            Bulk Upload Primers Preview
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Errors are shown first, then warnings, then clear rows.
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ mb: 2, maxHeight: '55vh', overflowY: 'auto', flex: 1, minHeight: 0 }}
          >
            <PrimerBulkUploadPreviewTable rows={orderedRows} />
          </TableContainer>

          <Typography variant="body2" sx={{ mb: 2 }}>
            {clearRows.length} clear, {warningRowsCount} warning, {errorRowsCount} error out of {orderedRows.length} uploaded primer{orderedRows.length === 1 ? '' : 's'}.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenModal(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSubmit(clearRows, 'clear')}
              disabled={clearRows.length < 1 || submitMutation.isPending || validateMutation.isPending}
            >
              {submitMutation.isPending ? <CircularProgress size={24} /> : 'Import Clear Primers'}
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleSubmit(clearAndWarningRows, 'clear and warning')}
              disabled={clearAndWarningRows.length < 1 || submitMutation.isPending || validateMutation.isPending}
            >
              {submitMutation.isPending ? <CircularProgress size={24} /> : 'Import Clear + Warnings'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
