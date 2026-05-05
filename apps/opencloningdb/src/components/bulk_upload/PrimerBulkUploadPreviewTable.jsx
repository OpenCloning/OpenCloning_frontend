import React from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, TableContainer, Paper, Button, CircularProgress } from '@mui/material';
import { Cancel as CancelIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material';
import { getPrimerRowsInfo, primerRowStatus, rowIssues } from '../../utils/bulk_upload';




function PrimerBulkUploadPreviewTableRow({ row }) {
  const issues = rowIssues(row);
  const status = primerRowStatus(row);
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
    ? 'Clear primer (no warning or error)'
    : `${isError ? 'Error' : 'Warning'}:\n${issues.join('\n')}`;

  return (
    <TableRow>
      <TableCell align="center" padding="checkbox">
        <Tooltip title={statusTooltip} placement="top">{statusIcon}</Tooltip>
      </TableCell>
      <TableCell>{row.name}</TableCell>
      <TableCell>{row.uid || '—'}</TableCell>
      <TableCell sx={{ maxWidth: 300 }}>
        <Box
          sx={{
            fontFamily: 'monospace',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            maxWidth: 300,
            pb: 0.25,
          }}
        >
          {row.sequence}
        </Box>
      </TableCell>
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
        <col style={{ width: '22%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '36%' }} />
        <col style={{ width: '30%' }} />
      </colgroup>
      <TableHead sx={{ textAlign: 'center' }}>
        <TableRow sx={{ textAlign: 'center' }}>
          <TableCell padding="checkbox"></TableCell>
          <TableCell>Name</TableCell>
          <TableCell>UID</TableCell>
          <TableCell>Sequence</TableCell>
          <TableCell>Issues</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <PrimerBulkUploadPreviewTableRow key={`${row.name}-${row.sequence}-${index}`} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}

export default function PrimerBulkUploadPreviewTable({ rows, handleSubmit, handleCancel, submitMutation, validateMutation }) {
  const { clearRows, clearAndWarningRows, warningRowsCount, errorRowsCount, orderedRows } = getPrimerRowsInfo(rows);
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
        {clearRows.length} clear, {warningRowsCount} warning, {errorRowsCount} error out of {orderedRows.length} uploaded primer{orderedRows.length === 1 ? '' : 's'}.
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
          {submitMutation.isPending ? <CircularProgress size={24} /> : 'Import Clear Primers'}
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
