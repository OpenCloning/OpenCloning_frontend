import React from 'react';
import { Typography, TableContainer, Paper, Button, CircularProgress, Box, TableRow, TableCell, FormControl } from '@mui/material';
import { Cancel as CancelIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material';
import TagMultiSelect from '../TagMultiSelect';


export function BulkUploadPreviewTableWrapper({
  rowsInfo,
  handleSubmit,
  handleCancel,
  isSubmitting,
  children,
  bulkTags = [],
  onBulkTagsChange,
}) {
  const { clearRows, clearAndWarningRows, warningRowsCount, errorRowsCount, orderedRows } = rowsInfo;
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
          Errors are shown first, then warnings, then clear rows.
      </Typography>
  
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mb: 2, maxHeight: '55vh', overflowY: 'auto', flex: 1, minHeight: 0 }}
      >
        {children}
      </TableContainer>
  
      <Typography variant="body2" sx={{ mb: 2 }}>
        {clearRows.length} clear, {warningRowsCount} warning, {errorRowsCount} error out of {orderedRows.length} uploaded items.
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
      </Box>
    </>
  );
}
  
export function StatusIcon({ status }) {
  const isClear = status === 'clear';
  const isError = status === 'error';

  return isClear ? (
    <CheckCircleIcon color="success" />
  ) : isError ? (
    <CancelIcon color="error" />
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
