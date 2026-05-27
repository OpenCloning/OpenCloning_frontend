import { SEQUENCE_TYPE_LABELS } from './query_utils';

export const VALID_TEMPLATE_SEQUENCE_TYPE_KEYS = Object.keys(SEQUENCE_TYPE_LABELS);

export function normalizeTemplateSequenceSubmission(row) {
  return {
    name: String(row.name ?? '').trim(),
    sequence_type: String(row.sequence_type ?? '').trim(),
  };
}

export function parseTemplateSequenceTypes(rows) {
  const invalidTypes = new Set();
  const items = rows.map((row) => {
    const normalized = normalizeTemplateSequenceSubmission(row);
    if (!VALID_TEMPLATE_SEQUENCE_TYPE_KEYS.includes(normalized.sequence_type)) {
      if (normalized.sequence_type) {
        invalidTypes.add(normalized.sequence_type);
      } else {
        invalidTypes.add('(empty)');
      }
    }
    return normalized;
  });
  return { items, invalidTypes: [...invalidTypes] };
}

export function prepareTemplateSequenceRowsForValidation(rows) {
  if (!Array.isArray(rows) || rows.length < 1) {
    throw new Error('File does not contain template sequence rows');
  }

  const { items, invalidTypes } = parseTemplateSequenceTypes(rows);
  if (invalidTypes.length > 0) {
    throw new Error(
      `Invalid sequence_type value(s): ${invalidTypes.join(', ')}. Valid values: ${VALID_TEMPLATE_SEQUENCE_TYPE_KEYS.join(', ')}`,
    );
  }

  const normalizedItems = items.filter((item) => item.name.length > 0);
  if (normalizedItems.length < 1) {
    throw new Error('File does not contain template sequence rows with names');
  }

  return normalizedItems;
}

export function templateSequenceRowIssues(row) {
  const issues = [];
  if (row.sequence_type_invalid) issues.push('Invalid sequence_type');
  if (row.name_exists) issues.push('Name already exists in workspace');
  if (row.name_duplicated) issues.push('Name duplicated in uploaded file');
  return issues;
}

export function templateSequenceRowStatus(row) {
  return templateSequenceRowIssues(row).length > 0 ? 'error' : 'clear';
}

export function getTemplateSequenceRowsInfo(rows) {
  const errorRows = rows.filter((row) => templateSequenceRowStatus(row) === 'error');
  const clearRows = rows.filter((row) => templateSequenceRowStatus(row) === 'clear');
  const orderedRows = [...errorRows, ...clearRows];
  return {
    errorRows,
    warningRows: [],
    clearRows,
    orderedRows,
    clearAndWarningRows: clearRows,
    clearRowsCount: clearRows.length,
    warningRowsCount: 0,
    errorRowsCount: errorRows.length,
    totalRowsCount: rows.length,
  };
}

export function rowIssues(row) {
  const issues = [];
  if (row.sequence_invalid) issues.push('Invalid DNA sequence');
  if (row.name_exists) issues.push('Name already exists in workspace');
  if (row.sequence_exists) issues.push('Sequence already exists in workspace');
  if (row.uid_exists) issues.push('UID already exists in workspace');
  if (row.name_duplicated) issues.push('Name duplicated in uploaded file');
  if (row.sequence_duplicated) issues.push('Sequence duplicated in uploaded file');
  if (row.uid_duplicated) issues.push('UID duplicated in uploaded file');
  return issues;
}

export function primerRowStatus(row) {
  if (row.uid_exists || row.uid_duplicated || row.sequence_invalid) {
    return 'error';
  }
  if (rowIssues(row).length > 0) {
    return 'warning';
  }
  return 'clear';
}

export function normalizePrimerSubmission(primer) {
  const name = String(primer.name ?? '').trim();
  const sequence = String(primer.sequence ?? '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const uid = String(primer.uid ?? '').trim();
  return {
    name,
    sequence,
    uid: uid.length > 0 ? uid : null,
  };
}

export function getPrimerRowsInfo(rows) {
  const errorRows = rows.filter((row) => primerRowStatus(row) === 'error');
  const warningRows = rows.filter((row) => primerRowStatus(row) === 'warning');
  const clearRows = rows.filter((row) => primerRowStatus(row) === 'clear');
  const orderedRows = [...errorRows, ...warningRows, ...clearRows];
  const clearAndWarningRows = [...warningRows, ...clearRows];
  const clearRowsCount = clearRows.length;
  const warningRowsCount = warningRows.length;
  const errorRowsCount = errorRows.length;
  const totalRowsCount = rows.length;
  return { errorRows, warningRows, clearRows, orderedRows, clearRowsCount, warningRowsCount, errorRowsCount, totalRowsCount, clearAndWarningRows };
}

export function sequenceRowIssues(row) {
  const issues = [];
  if (row.reading_error) issues.push('Unable to parse sequence file');
  if (row.name_exists) issues.push('Name already exists in workspace');
  if (row.sequence_exists) issues.push('Sequence already exists in workspace');
  if (row.sequence_circularised_exists) issues.push('Circularized sequence already exists in workspace');
  if (row.duplicated_name) issues.push('Name duplicated in uploaded files');
  if (row.duplicated_seguid) issues.push('Sequence duplicated in uploaded files');
  return issues;
}

export function sequenceRowStatus(row) {
  if (row.reading_error) {
    return 'error';
  }
  return sequenceRowIssues(row).length > 0 ? 'warning' : 'clear';
}

export function getSequenceRowsInfo(rows) {
  const errorRows = rows.filter((row) => sequenceRowStatus(row) === 'error');
  const warningRows = rows.filter((row) => sequenceRowStatus(row) === 'warning');
  const clearRows = rows.filter((row) => sequenceRowStatus(row) === 'clear');
  const orderedRows = [...errorRows, ...warningRows, ...clearRows];
  const clearAndWarningRows = [...warningRows, ...clearRows];
  const clearRowsCount = clearRows.length;
  const warningRowsCount = warningRows.length;
  const errorRowsCount = errorRows.length;
  const totalRowsCount = rows.length;
  return {
    errorRows,
    warningRows,
    clearRows,
    orderedRows,
    clearAndWarningRows,
    clearRowsCount,
    warningRowsCount,
    errorRowsCount,
    totalRowsCount,
  };
}
