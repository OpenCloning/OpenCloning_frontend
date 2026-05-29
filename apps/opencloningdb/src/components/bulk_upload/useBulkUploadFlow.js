import React from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAppAlerts from '../../hooks/useAppAlerts';

function defaultErrorMessage(error) {
  return error?.response?.data?.detail || error?.message || 'Request failed';
}

export default function useBulkUploadFlow({
  supportsTags = false,
  validateMutationFn,
  submitMutationFn,
  getValidateErrorMessage = defaultErrorMessage,
  getSubmitErrorMessage = defaultErrorMessage,
  getSuccessMessage,
  onSubmitSuccess,
  conflictMessage = 'Conflicts detected while importing. Review the updated validation results.',
}) {
  const hiddenFileInput = React.useRef(null);
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();
  const workspaceRole = useSelector((state) => state.auth.workspace?.role);
  const [openModal, setOpenModal] = React.useState(false);
  const [validationRows, setValidationRows] = React.useState([]);
  const [bulkTags, setBulkTags] = React.useState([]);

  const closeModal = React.useCallback(() => {
    setOpenModal(false);
    setBulkTags([]);
  }, []);

  const handleUploadClick = React.useCallback(() => {
    hiddenFileInput.current?.click();
  }, []);

  const validateMutation = useMutation({
    mutationFn: validateMutationFn,
  });

  const submitMutation = useMutation({
    mutationFn: submitMutationFn,
    onSuccess: (data, variables) => {
      const successMessage = getSuccessMessage?.(data, variables);
      if (successMessage) {
        addAlert({
          message: successMessage,
          severity: 'success',
        });
      }
      closeModal();
      setValidationRows([]);
      onSubmitSuccess?.(data, variables, queryClient);
    },
    onError: (error, variables) => {
      const conflictRows = error?.response?.status === 409 ? error?.response?.data : null;
      if (Array.isArray(conflictRows)) {
        setValidationRows(conflictRows);
        addAlert({
          message: conflictMessage,
          severity: 'warning',
        });
        return;
      }

      addAlert({
        message: getSubmitErrorMessage(error, variables),
        severity: 'error',
      });
    },
  });

  const validateSubmission = React.useCallback(
    async (submission, { requireRows = true, mapRows, openModalBeforeValidate = true } = {}) => {
      try {
        if (openModalBeforeValidate) {
          setOpenModal(true);
        }
        const rows = await validateMutation.mutateAsync(submission);
        if (requireRows && (!Array.isArray(rows) || rows.length < 1)) {
          throw new Error('No validation rows returned');
        }
        const nextRows = mapRows ? mapRows(rows) : rows;
        setValidationRows(nextRows);
        return nextRows;
      } catch (error) {
        if (openModalBeforeValidate) {
          setOpenModal(false);
        }
        addAlert({
          message: getValidateErrorMessage(error),
          severity: 'error',
        });
        return null;
      }
    },
    [addAlert, getValidateErrorMessage, validateMutation],
  );

  return {
    addAlert,
    bulkTags: supportsTags ? bulkTags : [],
    closeModal,
    handleUploadClick,
    hiddenFileInput,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isViewer: workspaceRole === 'viewer',
    openModal,
    setBulkTags: supportsTags ? setBulkTags : undefined,
    setValidationRows,
    submitRows: submitMutation.mutate,
    validationRows,
    validateSubmission,
  };
}
