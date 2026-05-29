import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { error2String } from '@opencloning/utils';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import CloningStrategyBulkUploadPreviewTable from './CloningStrategyBulkUploadPreviewTable';
import BulkUploadModal from './BulkUploadModal';
import useBulkUploadFlow from './useBulkUploadFlow';

export default function BulkUploadCloningStrategiesButton() {
  const {
    addAlert,
    bulkTags,
    closeModal,
    handleUploadClick,
    hiddenFileInput,
    isSubmitting,
    isValidating,
    isViewer,
    openModal,
    setBulkTags,
    submitRows,
    validationRows,
    validateSubmission,
  } = useBulkUploadFlow({
    supportsTags: true,
    validateMutationFn: async (files) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      const { data } = await openCloningDBHttpClient.post(endpoints.sequencesCloningStrategyBulkValidate, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    submitMutationFn: async ({ syncResults, tags }) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.sequencesCloningStrategyBulk, syncResults, {
        params: {
          ...(tags?.length ? { tags } : {}),
        },
      });
      return data;
    },
    getValidateErrorMessage: error2String,
    getSubmitErrorMessage: error2String,
    getSuccessMessage: (createdSequences, variables) => {
      const strategyCount = variables.syncResults.length;
      return `Imported ${strategyCount} cloning strateg${strategyCount === 1 ? 'y' : 'ies'} successfully${createdSequences.length > 0 ? ` (${createdSequences.length} sequences created)` : ''}`;
    },
    onSubmitSuccess: (_data, _variables, queryClient) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['primers'] });
    },
  });

  if (isViewer) {
    return null;
  }

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files ?? []);
    if (uploadedFiles.length < 1) {
      return;
    }

    try {
      await validateSubmission(uploadedFiles);
    } finally {
      event.target.value = null;
    }
  };

  const handleSubmit = (submittedRows) => {
    const syncResults = submittedRows
      .filter((row) => !row.already_synced && row.cloning_strategy)
      .map(({ file_name: fileName, cloning_strategy: cloningStrategy }) => ({
        ['file_name']: fileName,
        ['cloning_strategy']: cloningStrategy,
      }));

    if (syncResults.length < 1) {
      addAlert({
        message: 'No importable cloning strategies selected',
        severity: 'warning',
      });
      return;
    }

    submitRows({ syncResults, tags: bulkTags });
  };

  return (
    <>
      <Tooltip
        arrow
        title={(
          <span style={{ fontSize: '1.2em' }}>
            Upload one or more cloning strategy JSON files for validation preview
          </span>
        )}
      >
        <Button onClick={handleUploadClick} data-testid="bulk-upload-cloning-strategies-button">
          Bulk Upload Strategies
        </Button>
      </Tooltip>

      <input
        style={{ display: 'none' }}
        type="file"
        accept=".json,application/json"
        multiple
        ref={hiddenFileInput}
        onChange={handleFileUpload}
      />

      <BulkUploadModal
        open={openModal}
        onClose={closeModal}
        dataTestId="bulk-upload-cloning-strategies-modal"
        title="Bulk Upload Cloning Strategies Preview"
      >
        <CloningStrategyBulkUploadPreviewTable
          rows={validationRows}
          handleSubmit={handleSubmit}
          handleCancel={closeModal}
          isSubmitting={isSubmitting}
          isValidating={isValidating}
          bulkTags={bulkTags}
          onBulkTagsChange={setBulkTags}
        />
      </BulkUploadModal>
    </>
  );
}
