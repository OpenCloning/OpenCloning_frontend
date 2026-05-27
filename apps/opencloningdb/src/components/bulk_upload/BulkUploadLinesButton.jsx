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
import { error2String } from '@opencloning/utils';
import useAppAlerts from '../../hooks/useAppAlerts';
import LineBulkUploadPreviewTable from './LineBulkUploadPreviewTable';
import { prepareLineRowsForValidation } from '../../utils/bulk_upload';

export default function BulkUploadLinesButton() {
  const hiddenFileInput = React.useRef(null);
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();
  const workspaceRole = useSelector((state) => state.auth.workspace?.role);
  const [openModal, setOpenModal] = React.useState(false);
  const [validationRows, setValidationRows] = React.useState([]);

  const closeModal = () => {
    setOpenModal(false);
  };

  const validateMutation = useMutation({
    mutationFn: async (items) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.linesValidateUpload, items);
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
    mutationFn: async (items) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.linesBulk, items);
      return data;
    },
    onSuccess: (created) => {
      addAlert({
        message: `Imported ${created.length} line${created.length === 1 ? '' : 's'} successfully`,
        severity: 'success',
      });
      closeModal();
      setValidationRows([]);
      queryClient.invalidateQueries({ queryKey: ['lines'] });
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
        message: 'Server error while importing lines',
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
      const parsed = await delimitedFileToJson(
        fileUploaded,
        ['uid', 'plasmids', 'genotype', 'parent_uids'],
        true,
      );
      const normalizedItems = prepareLineRowsForValidation(parsed);
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
    const items = rows.map((row) => ({
      uid: row.uid,
      genotype: row.genotype,
      plasmids: row.plasmids,
      parent_uids: row.parent_uids,
    }));
    submitMutation.mutate(items);
  };

  return (
    <>
      <Tooltip
        arrow
        title={(
          <span style={{ fontSize: '1.2em' }}>
            Upload a .csv or .tsv file with headers uid, plasmids, genotype, parent_uids (case-insensitive).
            Plasmids, genotype, and parent_uids are space-separated lists. At most two parent UIDs per line.
          </span>
        )}
      >
        <Button onClick={handleUploadClick} data-testid="bulk-upload-lines-button">
          Bulk Upload Lines
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
          data-testid="bulk-upload-lines-modal"
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
            Bulk Upload Lines Preview
          </Typography>
          <LineBulkUploadPreviewTable
            rows={validationRows}
            handleSubmit={handleSubmit}
            handleCancel={closeModal}
            isSubmitting={submitMutation.isPending}
            isValidating={validateMutation.isPending}
          />
        </Box>
      </Modal>
    </>
  );
}
