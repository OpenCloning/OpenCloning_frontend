import React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Modal,
  Tooltip,
  Typography,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useAppAlerts from '../../hooks/useAppAlerts';
import SequenceBulkUploadPreviewTable from './SequenceBulkUploadPreviewTable';

export default function BulkUploadSequencesButton() {
  const hiddenFileInput = React.useRef(null);
  const { addAlert } = useAppAlerts();
  const [openModal, setOpenModal] = React.useState(false);
  const [validationRows, setValidationRows] = React.useState([]);

  const validateMutation = useMutation({
    mutationFn: async (files) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      const { data } = await openCloningDBHttpClient.post(endpoints.sequencesValidateUpload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onError: (error) => {
      addAlert({
        message: String(error?.response?.data?.detail) || String(error?.message) || 'Failed to validate sequences',
        severity: 'error',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ rows }) => {
      // Temporary mock endpoint behavior until backend submission endpoint is available.
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
      return rows;
    },
    onSuccess: (importedRows, variables) => {
      addAlert({
        message: `Imported ${importedRows.length} ${variables.modeLabel} sequence${importedRows.length === 1 ? '' : 's'} successfully (mock)`,
        severity: 'success',
      });
      setOpenModal(false);
      setValidationRows([]);
    },
    onError: () => {
      addAlert({
        message: 'Mock submission failed',
        severity: 'error',
      });
    },
  });

  const handleUploadClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files ?? []);
    if (uploadedFiles.length < 1) {
      return;
    }

    try {
      const rows = await validateMutation.mutateAsync(uploadedFiles);
      if (!Array.isArray(rows) || rows.length < 1) {
        throw new Error('No validation rows returned');
      }
      setValidationRows(rows);
      setOpenModal(true);
    } catch (error) {
      addAlert({
        message: error?.response?.data?.detail || error?.message || 'Failed to validate sequence files',
        severity: 'error',
      });
    } finally {
      event.target.value = null;
    }
  };

  const handleSubmit = (rows, modeLabel) => {
    if (rows.length < 1) {
      return;
    }
    submitMutation.mutate({ rows, modeLabel });
  };

  return (
    <>
      <Tooltip
        arrow
        title={(
          <span style={{ fontSize: '1.2em' }}>
            Upload sequence files for bulk validation preview
          </span>
        )}
      >
        <Button onClick={handleUploadClick} data-testid="bulk-upload-sequences-button">
          Bulk Upload Sequences
        </Button>
      </Tooltip>

      <input
        style={{ display: 'none' }}
        type="file"
        multiple
        ref={hiddenFileInput}
        onChange={handleFileUpload}
      />

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          data-testid="bulk-upload-sequences-modal"
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
            Bulk Upload Sequences Preview
          </Typography>
          <SequenceBulkUploadPreviewTable
            rows={validationRows}
            handleSubmit={handleSubmit}
            handleCancel={() => setOpenModal(false)}
            submitMutation={submitMutation}
            validateMutation={validateMutation}
          />
        </Box>
      </Modal>
    </>
  );
}
