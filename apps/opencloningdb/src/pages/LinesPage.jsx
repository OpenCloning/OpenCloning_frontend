import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  TableContainer,
  TablePagination,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  Button,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { parseLinesParams, applyLinesParamsToSearchParams } from '../utils/query_utils';
import SearchBarTextField from '../components/SearchBarTextField';
import TagMultiSelect from '../components/TagMultiSelect';
import { UrlParamsForm } from '../components/urlParamsForm';
import TagEntitiesButton from '../components/TagEntitiesButton';
import TopButtonSection from '../components/TopButtonSection';
import PageContainer from '../components/PageContainer';
import LinesTable from '../components/LinesTable';
import BulkUploadLinesButton from '../components/bulk_upload/BulkUploadLinesButton';

const MIN_WIDTH = 150;

function LinesQueryFields({ pendingParams, setPendingParams }) {
  return (
    <>
      <SearchBarTextField
        label="UID"
        placeholder="Search by UID"
        value={pendingParams.uid ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, uid: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <SearchBarTextField
        label="Genotype"
        placeholder="Search by allele names"
        value={pendingParams.genotype ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, genotype: value }))}
        sx={{ minWidth: MIN_WIDTH * 1.5 }}
      />
      <SearchBarTextField
        label="Plasmid"
        placeholder="Search by plasmid"
        value={pendingParams.plasmid ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, plasmid: value }))}
        sx={{ minWidth: MIN_WIDTH * 1.5 }}
      />
      <TagMultiSelect
        size="small"
        value={pendingParams.tags ?? []}
        onChange={(value) => setPendingParams((p) => ({ ...p, tags: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <SearchBarTextField
        label="Created by"
        placeholder="Search by user name"
        value={pendingParams.created_by ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, created_by: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <Button variant="contained" color="primary" type="submit">
        Search
      </Button>
    </>
  );
}

function LinesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchParams] = useSearchParams();

  const filters = useMemo(
    () => parseLinesParams(searchParams),
    [searchParams],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['lines', { page: page + 1, size: rowsPerPage, ...filters }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.lines, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          ...filters,
        },
      });
      return res;
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];

  const toggleRow = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selectedEntities = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds]);

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load lines'}</Alert>;

  return (
    <PageContainer data-testid="lines-page">
      <Typography variant="h5" sx={{ mb: 2 }}>
        Lines
      </Typography>
      <UrlParamsForm
        parse={parseLinesParams}
        applyToSearchParams={applyLinesParamsToSearchParams}
        component={LinesQueryFields}
      />
      <TopButtonSection>
        <BulkUploadLinesButton />
        <TagEntitiesButton onSuccess={() => setSelectedIds(new Set())} selectedEntities={selectedEntities} entityType="lines" label="Lines" />
      </TopButtonSection>
      <TableContainer component={Paper}>
        <LinesTable lines={items} showCreatedBy showCreatedAt withCheckbox={true} selectedIds={selectedIds} toggleRow={toggleRow} />
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={(_, newPage) => { setPage(newPage); setSelectedIds(new Set()); }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
            setSelectedIds(new Set());
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>
    </PageContainer>
  );
}

export default LinesPage;
