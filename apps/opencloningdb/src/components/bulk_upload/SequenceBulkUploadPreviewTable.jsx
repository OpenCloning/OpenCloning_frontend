import React from 'react';
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { getSequenceRowsInfo, sequenceRowIssues, sequenceRowStatus } from '../../utils/bulk_upload';
import { BulkUploadPreviewTableWrapper, CommonTableRow } from './common';

function SequenceBulkUploadPreviewTableRow({ row }) {
  const issues = sequenceRowIssues(row);
  const status = sequenceRowStatus(row);
  return (
    <CommonTableRow status={status} issues={issues}>
      <TableCell>{row.file_name || '—'}</TableCell>
      <TableCell>{row.name || '—'}</TableCell>
      <TableCell>{row.length ?? '—'}</TableCell>
      <TableCell>{typeof row.circular === 'boolean' ? (row.circular ? 'Yes' : 'No') : '—'}</TableCell>
    </CommonTableRow>
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
  isSubmitting,
  isValidating,
  bulkTags,
  onBulkTagsChange,
}) {
  if (isValidating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  const rowsInfo = getSequenceRowsInfo(rows);
  return (
    <BulkUploadPreviewTableWrapper
      rowsInfo={rowsInfo}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
      isSubmitting={isSubmitting}
      bulkTags={bulkTags}
      onBulkTagsChange={onBulkTagsChange}
    >
      <TableComponent rows={rowsInfo.orderedRows} />
    </BulkUploadPreviewTableWrapper>
  );
}
