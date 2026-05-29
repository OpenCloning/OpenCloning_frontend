import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { delimitedFileToJson } from '@opencloning/utils/fileParsers';
import { error2String } from '@opencloning/utils';
import LineBulkUploadPreviewTable from './LineBulkUploadPreviewTable';
import { prepareLineRowsForValidation } from '../../utils/bulk_upload';
import BulkUploadModal from './BulkUploadModal';
import useBulkUploadFlow from './useBulkUploadFlow';

export default function BulkUploadLinesButton() {
  const {
    addAlert,
    closeModal,
    handleUploadClick,
    hiddenFileInput,
    isSubmitting,
    isValidating,
    isViewer,
    openModal,
    submitRows,
    validationRows,
    validateSubmission,
  } = useBulkUploadFlow({
    validateMutationFn: async (items) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.linesValidateUpload, items);
      return data;
    },
    submitMutationFn: async (items) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.linesBulk, items);
      return data;
    },
    getValidateErrorMessage: error2String,
    getSubmitErrorMessage: () => 'Server error while importing lines',
    getSuccessMessage: (created) => `Imported ${created.length} line${created.length === 1 ? '' : 's'} successfully`,
    onSubmitSuccess: (_data, _variables, queryClient) => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    },
  });

  if (isViewer) {
    return null;
  }

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
      await validateSubmission(normalizedItems);
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
    const items = rows.map(({ uid, genotype, plasmids, parent_uids: parentUids }) => ({
      uid,
      genotype,
      plasmids,
      ['parent_uids']: parentUids,
    }));
    submitRows(items);
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

      <BulkUploadModal
        open={openModal}
        onClose={closeModal}
        dataTestId="bulk-upload-lines-modal"
        title="Bulk Upload Lines Preview"
      >
        <LineBulkUploadPreviewTable
          rows={validationRows}
          handleSubmit={handleSubmit}
          handleCancel={closeModal}
          isSubmitting={isSubmitting}
          isValidating={isValidating}
        />
      </BulkUploadModal>
    </>
  );
}
