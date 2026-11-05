import React from 'react';
import { Button, Tooltip } from '@mui/material';
import {
  CloningStrategyBulkUploadPreviewTable,
  rowsToCloningStrategySyncResults,
  submitCloningStrategies,
  validateCloningStrategyFiles,
} from '@opencloning/opencloningdb';
import BulkUploadModal from './BulkUploadModal';
import useBulkUploadFlow from './useBulkUploadFlow';

export default function BulkUploadCloningStrategiesButton() {
  const {
    addErrorAlert,
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
    validateMutationFn: validateCloningStrategyFiles,
    submitMutationFn: submitCloningStrategies,
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
    const syncResults = rowsToCloningStrategySyncResults(submittedRows);

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
            Upload OpenCloning JSON files (cloning strategy files) or SnapGene (.dna) files
          </span>
        )}
      >
        <Button onClick={handleUploadClick} data-testid="bulk-upload-cloning-strategies-button">
          Upload sequences with history
        </Button>
      </Tooltip>

      <input
        style={{ display: 'none' }}
        type="file"
        accept=".json,.dna"
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
          onTagCreateError={addErrorAlert}
        />
      </BulkUploadModal>
    </>
  );
}
