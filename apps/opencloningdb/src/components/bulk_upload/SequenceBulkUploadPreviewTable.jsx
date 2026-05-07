import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  TableContainer,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { Cancel as CancelIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material';
import { getSequenceRowsInfo, sequenceRowIssues, sequenceRowStatus } from '../../utils/bulk_upload';

function SequenceBulkUploadPreviewTableRow({ row }) {
  const issues = sequenceRowIssues(row);
  const status = sequenceRowStatus(row);
  const isClear = status === 'clear';
  const isError = status === 'error';
  const statusIcon = isClear ? (
    <CheckCircleIcon color="success" />
  ) : isError ? (
    <CancelIcon color="error" />
  ) : (
    <WarningIcon color="warning" />
  );
  const statusTooltip = isClear
    ? 'Clear sequence (no warning or error)'
    : `${isError ? 'Error' : 'Warning'}:\n${issues.join('\n')}`;

  return (
    <TableRow>
      <TableCell align="center" padding="checkbox">
        <Tooltip title={statusTooltip} placement="top">{statusIcon}</Tooltip>
      </TableCell>
      <TableCell>{row.file_name || '—'}</TableCell>
      <TableCell>{row.name || '—'}</TableCell>
      <TableCell>{row.length ?? '—'}</TableCell>
      <TableCell>{typeof row.circular === 'boolean' ? (row.circular ? 'Yes' : 'No') : '—'}</TableCell>
      <TableCell>
        {!isClear && (
          issues.map((issue) => (
            <div key={issue}>{issue}</div>
          ))
        )}
      </TableCell>
    </TableRow>
  );
}

function TableComponent({ rows }) {
  return (
    <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
      <colgroup>
        <col style={{ width: '48px' }} />
        <col style={{ width: '24%' }} />
        <col style={{ width: '24%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '32%' }} />
      </colgroup>
      <TableHead sx={{ textAlign: 'center' }}>
        <TableRow sx={{ textAlign: 'center' }}>
          <TableCell padding="checkbox"></TableCell>
          <TableCell>File Name</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Length</TableCell>
          <TableCell>Circular</TableCell>
          <TableCell>Warnings</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <SequenceBulkUploadPreviewTableRow key={`${row.file_name}-${row.seguid}-${index}`} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}

export default function SequenceBulkUploadPreviewTable({
  rows,
  handleSubmit,
  handleCancel,
  submitMutation,
  validateMutation,
}) {
  const {
    clearRows,
    clearAndWarningRows,
    warningRowsCount,
    errorRowsCount,
    orderedRows,
  } = getSequenceRowsInfo(rows);
  return (
    <>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Errors are shown first, then warnings, then clear rows.
      </Typography>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mb: 2, maxHeight: '55vh', overflowY: 'auto', flex: 1, minHeight: 0 }}
      >
        <TableComponent rows={orderedRows} />
      </TableContainer>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {clearRows.length} clear, {warningRowsCount} warning, {errorRowsCount} error out of {orderedRows.length} uploaded sequence{orderedRows.length === 1 ? '' : 's'}.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleCancel}
          disabled={submitMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSubmit(clearRows, 'clear')}
          disabled={clearRows.length < 1 || submitMutation.isPending || validateMutation.isPending}
        >
          {submitMutation.isPending ? <CircularProgress size={24} /> : 'Import Clear Sequences'}
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
    </>
  );
}
