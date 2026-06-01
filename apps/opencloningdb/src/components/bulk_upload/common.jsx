import React from 'react';
import { Typography, TableContainer, Paper, Button, CircularProgress, Box, TableRow, TableCell, FormControl } from '@mui/material';
import { Cancel as CancelIcon, CheckCircle as CheckCircleIcon, Info as InfoIcon, Warning as WarningIcon } from '@mui/icons-material';
import TagMultiSelect from '../TagMultiSelect';


export function BulkUploadPreviewTableWrapper({
  rowsInfo,
  handleSubmit,
  handleCancel,
  isSubmitting,
  children,
  bulkTags = [],
  onBulkTagsChange,
  importMode = 'clearAndWarnings',
}) {
  const { clearRows, clearAndWarningRows, warningRowsCount, errorRowsCount, infoRowsCount = 0, orderedRows } = rowsInfo;
  const allClearRequired = importMode === 'allClearRequired';
  const canImportAll = clearRows.length === orderedRows.length && orderedRows.length > 0;
  const summaryText = allClearRequired
    ? `${clearRows.length} clear, ${errorRowsCount} error${infoRowsCount ? `, ${infoRowsCount} informational` : ''} out of ${orderedRows.length} uploaded items.`
    : `${clearRows.length} clear, ${warningRowsCount} warning, ${errorRowsCount} error${infoRowsCount ? `, ${infoRowsCount} informational` : ''} out of ${orderedRows.length} uploaded items.`;
  const orderingText = allClearRequired
    ? 'All rows must be clear to import. Errors are shown first.'
    : infoRowsCount > 0
      ? 'Errors are shown first, then warnings, informational rows, and clear rows.'
      : 'Errors are shown first, then warnings, then clear rows.';

  return (
    <>
      {onBulkTagsChange && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <TagMultiSelect
            label="Tags to apply (optional)"
            value={bulkTags}
            onChange={onBulkTagsChange}
            data-testid="bulk-upload-tags"
          />
        </FormControl>
      )}
      <Typography variant="body2" sx={{ mb: 2 }}>
        {orderingText}
      </Typography>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mb: 2, maxHeight: '55vh', overflowY: 'auto', flex: 1, minHeight: 0 }}
      >
        {children}
      </TableContainer>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {summaryText}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        {allClearRequired ? (
          <Button
            variant="contained"
            onClick={() => handleSubmit(orderedRows)}
            disabled={!canImportAll || isSubmitting}
            data-testid="bulk-upload-import-button"
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={() => handleSubmit(clearRows, 'clear')}
              disabled={clearRows.length < 1 || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Import Clear'}
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleSubmit(clearAndWarningRows, 'clear and warning')}
              disabled={clearAndWarningRows.length < 1 || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Import Clear + Warnings'}
            </Button>
          </>
        )}
      </Box>
    </>
  );
}
  
export function StatusIcon({ status }) {
  const isClear = status === 'clear';
  const isError = status === 'error';
  const isInfo = status === 'info';

  return isClear ? (
    <CheckCircleIcon color="success" />
  ) : isError ? (
    <CancelIcon color="error" />
  ) : isInfo ? (
    <InfoIcon color="info" />
  ) : (
    <WarningIcon color="warning" />
  );
}


export function CommonTableRow({ status, issues, children }) {

  return (
    <TableRow>
      <TableCell align="center" padding="checkbox">
        <StatusIcon status={status} />
      </TableCell>
      {children}
      <TableCell>
        {status !== 'clear' && (
          issues.map((issue) => (
            <div key={issue}>{issue}</div>
          ))
        )}
      </TableCell>
    </TableRow>
  );
}
