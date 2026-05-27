import React from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Modal,
  Tooltip,
  Typography,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { delimitedFileToJson } from '@opencloning/utils/fileParsers';
import useAppAlerts from '../../hooks/useAppAlerts';
import TemplateSequenceBulkUploadPreviewTable from './TemplateSequenceBulkUploadPreviewTable';
import {
  prepareTemplateSequenceRowsForValidation,
  VALID_TEMPLATE_SEQUENCE_TYPE_KEYS,
} from '../../utils/bulk_upload';
import { error2String } from '@opencloning/utils';

const VALID_TYPES_HINT = VALID_TEMPLATE_SEQUENCE_TYPE_KEYS.join(', ');

export default function BulkUploadTemplateSequencesButton() {
  const hiddenFileInput = React.useRef(null);
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();
  const workspaceRole = useSelector((state) => state.auth.workspace?.role);
  const [openModal, setOpenModal] = React.useState(false);
  const [validationRows, setValidationRows] = React.useState([]);
  const [bulkTags, setBulkTags] = React.useState([]);

  const closeModal = () => {
    setOpenModal(false);
    setBulkTags([]);
  };

  const validateMutation = useMutation({
    mutationFn: async (items) => {
      const { data } = await openCloningDBHttpClient.post(
        endpoints.templateSequencesValidateUpload,
        items,
      );
      return data;
    },
    onError: (error) => {
      addAlert({
        message: error2String(error),
        severity: 'error',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ items, tags }) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.templateSequencesBulk, items, {
        params: {
          ...(tags?.length ? { tags } : {}),
        },
      });
      return data;
    },
    onSuccess: (created) => {
      addAlert({
        message: `Imported ${created.length} template sequence${created.length === 1 ? '' : 's'} successfully`,
        severity: 'success',
      });
      closeModal();
      setValidationRows([]);
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
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
        message: 'Server error while importing template sequences',
        severity: 'error',
      });
    },
  });

  if (workspaceRole === 'viewer') {
    return null;
  }

  const handleUploadClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleFileUpload = async (event) => {
    const fileUploaded = event.target.files?.[0];
    if (!fileUploaded) {
      return;
    }

    try {
      const parsed = await delimitedFileToJson(fileUploaded, ['name', 'sequence_type'], true);
      const normalizedItems = prepareTemplateSequenceRowsForValidation(parsed);
      setOpenModal(true);
      const rows = await validateMutation.mutateAsync(normalizedItems);
      setValidationRows(rows);
    } catch (error) {
      addAlert({
        message: error2String(error),
        severity: 'error',
      });
    } finally {
      event.target.value = null;
    }
  };

  const handleSubmit = (rows) => {
    if (rows.length < 1) {
      return;
    }
    const items = rows.map(({ name, sequence_type }) => ({ name, sequence_type }));
    submitMutation.mutate({ items, tags: bulkTags });
  };

  return (
    <>
      <Tooltip
        arrow
        title={(
          <span style={{ fontSize: '1.2em' }}>
            Upload a .csv or .tsv file with headers name, sequence_type (case-insensitive).
            {' '}
            Valid sequence_type values:
            {' '}
            {VALID_TYPES_HINT}
          </span>
        )}
      >
        <Button onClick={handleUploadClick} data-testid="bulk-upload-template-sequences-button">
          Bulk Upload Templates
        </Button>
      </Tooltip>

      <input
        style={{ display: 'none' }}
        type="file"
        accept=".csv,.tsv"
        ref={hiddenFileInput}
        onChange={handleFileUpload}
      />

      <Modal open={openModal} onClose={closeModal}>
        <Box
          data-testid="bulk-upload-template-sequences-modal"
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
            Bulk Upload Template Sequences Preview
          </Typography>
          <TemplateSequenceBulkUploadPreviewTable
            rows={validationRows}
            handleSubmit={handleSubmit}
            handleCancel={closeModal}
            isSubmitting={submitMutation.isPending}
            isValidating={validateMutation.isPending}
            bulkTags={bulkTags}
            onBulkTagsChange={setBulkTags}
          />
        </Box>
      </Modal>
    </>
  );
}
