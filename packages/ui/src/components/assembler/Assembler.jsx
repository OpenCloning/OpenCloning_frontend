import React from 'react'
import {
  Alert, Autocomplete, Box, Button, CircularProgress, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, ButtonGroup,
  DialogTitle,
  Dialog,
  DialogContent,
  FormControlLabel,
  Switch
} from '@mui/material'
import { Clear as ClearIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { useAssembler } from './useAssembler';
import { useDispatch, useSelector } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import AssemblerPart from './AssemblerPart';
import EditTextDialog from '../form/EditTextDialog';

import useCombinatorialAssembly from './useCombinatorialAssembly';
import ExistingSyntaxDialog from './ExistingSyntaxDialog';
import error2String from '@opencloning/utils/error2String';
import { categoryFilter, downloadAssemblerFilesAsZip, getFilesToExportFromAssembler, getDefaultAssemblyOutputName, MAX_OUTPUT_NAME_LENGTH, sanitizeOutputName } from './assembler_utils';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';
import useCloningAlerts from '../../hooks/useCloningAlerts';
import UploadPlasmidsButton from './UploadPlasmidsButton';
import { useConfig } from '../../providers';
import { isEqual } from 'lodash-es';
import SyntaxOverviewTable from './SyntaxOverviewTable';
import { graphToMSA, partsToGraph } from './graph_utils';


const { setState: setCloningState, setCurrentTab: setCurrentTabAction } = cloningActions;

function formatItemName(item) {
  // Fallback in case the item is not found (while updating list)
  return item ? `${item.plasmid_name}` : '-'
}

function isRowInvalid(rowIndex, assemblyOutputNames) {
  const name = assemblyOutputNames[rowIndex] ?? '';
  const trimmed = name.trim();
  const isEmpty = trimmed.length === 0;
  const isTooLong = name.length > MAX_OUTPUT_NAME_LENGTH;
  const isDuplicate = assemblyOutputNames.filter((n) => n === name).length > 1;
  return isEmpty || isTooLong || isDuplicate;
}

function AssemblerProductTable({
  requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories,
  assemblyOutputNames, onOutputNameChange,
}) {
  const dispatch = useDispatch();
  const [editDialog, setEditDialog] = React.useState({ open: false, rowIndex: null, value: '' });

  const handleViewAssembly = (index) => {
    const newState = requestedAssemblies[index];
    dispatch(setCloningState(newState));
    dispatch(setCurrentTabAction(0));
  };

  const handleEdit = (rowIndex) => () => {
    setEditDialog({ open: true, rowIndex, value: assemblyOutputNames[rowIndex] ?? '' });
  };

  const handleEditSave = (newValue) => {
    if (editDialog.rowIndex !== null) {
      onOutputNameChange(editDialog.rowIndex, sanitizeOutputName(newValue));
    }
    setEditDialog({ open: false, rowIndex: null, value: '' });
  };

  const rows = expandedAssemblies.map((parts, rowIndex) => ({
    id: rowIndex,
    outputName: assemblyOutputNames[rowIndex] ?? '',
    rowIndex,
    parts,
  }));

  const columns = [
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 60,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="View"
          onClick={() => handleViewAssembly(params.row.rowIndex)}
          data-testid="assembler-product-table-view-button"
        />,
      ],
    },
    {
      field: 'outputName',
      headerName: 'Output name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value || 'Click to edit...'}
          </Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(params.row.rowIndex)(); }} data-testid="assembler-product-table-edit-button">
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    ...currentCategories.map((categoryId, idx) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        field: `category_${categoryId}`,
        headerName: category?.displayName ?? '',
        flex: 1,
        valueGetter: (value, row) => formatItemName(plasmids.find((d) => d.id === row.parts[idx])),
      };
    }),
  ];

  return (
    <Box data-testid="assembler-product-table" sx={{ '& .MuiDataGrid-cell': { fontSize: '1.2rem' }, '& .MuiDataGrid-columnHeader': { fontSize: '1.2rem', fontWeight: 'bold' } }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowClassName={(params) => (isRowInvalid(params.row.rowIndex, assemblyOutputNames) ? 'error-row' : '')}
        density="compact"
        disableRowSelectionOnClick
        disableColumnSorting
        disableColumnFilter
        disableColumnMenu
        hideFooter
        autoHeight
        sx={{
          '& .error-row': {
            backgroundColor: 'rgba(255, 0, 0, 0.15)',
            '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.25)' },
          },
        }}
      />
      <EditTextDialog
        open={editDialog.open}
        value={editDialog.value}
        onClose={() => setEditDialog({ open: false, rowIndex: null, value: '' })}
        onSave={handleEditSave}
        title="Edit Output Name"
        placeholder="Enter output name..."
        maxLength={MAX_OUTPUT_NAME_LENGTH}
      />
    </Box>
  );
}

function AssemblerBox({ item, index, setCategory, setId, categories, plasmids, assembly }) {

  const allowedCategories = categories.filter((category) => categoryFilter(category, categories, index === 0 ? null : assembly[index - 1].category))
  const isCompleted = item.category !== '' && item.plasmidIds.length > 0
  const borderColor = isCompleted ? 'success.main' : 'primary.main'
  const thisCategory = categories.find((category) => category.id === item.category)
  const allowedPlasmids = thisCategory ? plasmids.filter((d) => d.key === thisCategory.key) : [];

  return(
    <Box sx={{ width: '250px', border: 3, borderColor, borderRadius: 4, p: 2 }}>
      <FormControl data-testid="category-select" fullWidth sx={{ mb: 2 }}>
        <InputLabel>Category</InputLabel>
        <Select
          endAdornment={item.category && allowedCategories.length > 1 && (<InputAdornment position="end"><IconButton onClick={() => setCategory('', index)}><ClearIcon /></IconButton></InputAdornment>)}
          value={item.category}
          onChange={(e) => setCategory(e.target.value, index)}
          label="Category"
          disabled={index < assembly.length}
        >
          {allowedCategories.map((category) => (
            <MenuItem key={category.id} value={category.id}>{category.displayName}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {thisCategory && (
        <>
          <FormControl data-testid="plasmid-select" fullWidth>
            <Autocomplete
              multiple
              value={item.plasmidIds}
              onChange={(e, value) => setId(value, index)}
              options={allowedPlasmids.map((item) => item.id)}
              getOptionLabel={(id) => formatItemName(plasmids.find((d) => d.id === id))}
              renderInput={(params) => <TextField {...params} label="Plasmids" />}
              componentsProps={{
                popper: {
                  sx: { minWidth: 'max-content' },
                },
              }}
              renderOption={(props, option) => {
                const { key, ...restProps } = props
                const plasmid = plasmids.find((d) => d.id === option)
                return (
                  <MenuItem key={key} {...restProps} sx={{ backgroundColor: plasmid.userUploaded === true ? '#dcedc8' : undefined }}>
                    {formatItemName(plasmid)}
                  </MenuItem>
                )}}
            />
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <AssemblerPart data={ thisCategory }/>
          </Box>
        </>
      )}
    </Box>
  )
}

export function AssemblerComponent({ plasmids, categories, assemblyEnzymes, addAlert, appInfo }) {

  const [requestedAssemblies, setRequestedAssemblies] = React.useState([])
  const [assemblyOutputNames, setAssemblyOutputNames] = React.useState([])
  const [errorMessage, setErrorMessage] = React.useState('')
  const [loadingMessage, setLoadingMessage] = React.useState('')

  const clearAssemblySelection = React.useCallback(() => {
    setRequestedAssemblies([])
    setAssemblyOutputNames([])
    setErrorMessage('')
  }, [])

  const { assembly, setCategory, setId, expandedAssemblies, assemblyComplete, canBeSubmitted, currentCategories } = useCombinatorialAssembly({ onValueChange: clearAssemblySelection, categories, plasmids })
  const { requestSources, requestAssemblies } = useAssembler()

  const onOutputNameChange = React.useCallback((index, name) => {
    setAssemblyOutputNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const namesAreUnique = new Set(assemblyOutputNames).size === assemblyOutputNames.length;
  const namesNonEmpty = assemblyOutputNames.length > 0 && assemblyOutputNames.every((n) => n.trim().length > 0);
  const namesNotTooLong = assemblyOutputNames.every((n) => n.length <= MAX_OUTPUT_NAME_LENGTH);
  const canDownload = requestedAssemblies.length > 0 && namesAreUnique && namesNonEmpty && namesNotTooLong;

  const onSubmitAssembly = React.useCallback(async () => {
    clearAssemblySelection()
    const selectedPlasmids = assembly.map(({ plasmidIds }) => plasmidIds.map((id) => (plasmids.find((item) => item.id === id))))

    let errorMessage = 'Error fetching sequences'
    try {
      setLoadingMessage('Requesting sequences...')
      const resp = await requestSources(selectedPlasmids)
      errorMessage = 'Error assembling sequences'
      setLoadingMessage('Assembling...')
      const assemblies = await requestAssemblies(resp, assemblyEnzymes)
      setRequestedAssemblies(assemblies)
      if (expandedAssemblies && expandedAssemblies.length > 0) {
        setAssemblyOutputNames(
          expandedAssemblies.map((_, i) => getDefaultAssemblyOutputName(i, expandedAssemblies, plasmids)),
        )
      }
    } catch (e) {
      if (e.assembly) {
        errorMessage = (<><div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{error2String(e)}</div><div>Error assembling {e.assembly.map((p) => formatItemName(p.plasmid)).join(', ')}</div></>)
      } else if (e.plasmid) {
        errorMessage = (<><div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{error2String(e)}</div><div>Error fetching sequence for {formatItemName(e.plasmid)}</div></>)
      }
      setErrorMessage(errorMessage)
    } finally {
      setLoadingMessage(false)
    }
  }, [assemblyEnzymes, assembly, plasmids, requestSources, requestAssemblies, clearAssemblySelection])

  const onDownloadAssemblies = React.useCallback(async () => {
    try {
      const files = getFilesToExportFromAssembler({
        requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories, appInfo, outputNames: assemblyOutputNames,
      });
      await downloadAssemblerFilesAsZip(files);
    } catch (error) {
      console.error('Error downloading assemblies:', error);
      addAlert({
        message: `Error downloading assemblies: ${error.message}`,
        severity: 'error',
      });
    }
  }, [requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories, appInfo, addAlert, assemblyOutputNames])

  const options = React.useMemo(() => assemblyComplete ? assembly : [...assembly, { category: '', plasmidIds: [] }], [assembly, assemblyComplete])

  return (
    <Box className="assembler-container" sx={{ width: '80%', margin: 'auto', mb: 4 }}>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ overflowX: 'auto', my: 2 }}>
        {options.map((item, index) =>
          <AssemblerBox key={index} {...{item, index, setCategory, setId, categories, plasmids, assembly}} />
        )}
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 2 }}>
        {canBeSubmitted && <>
          <Button
            sx={{ p: 2, fontSize: '1.2rem' }}
            variant="contained"
            color="primary"
            data-testid="assembler-submit-button"
            onClick={onSubmitAssembly}
            disabled={Boolean(loadingMessage)}>
            {loadingMessage ? <><CircularProgress /> {loadingMessage}</> : 'Submit'}
          </Button>
        </>}
        {requestedAssemblies.length > 0 && <Button
          color="success"
          variant="contained"
          data-testid="assembler-download-assemblies-button"
          sx={{ p: 2, fontSize: '1.2rem' }}
          onClick={onDownloadAssemblies}
          disabled={!canDownload}
          title={!canDownload ? 'Output names must be unique, non-empty, and at most 255 characters' : ''}>Download Assemblies
        </Button>}
      </Box>
      {errorMessage && <Alert severity="error" sx={{ my: 2, maxWidth: 300, margin: 'auto', fontSize: '1.2rem' }}>{errorMessage}</Alert>}
      {requestedAssemblies.length > 0 &&
        <AssemblerProductTable {...{
          requestedAssemblies, expandedAssemblies, plasmids, currentCategories, categories,
          assemblyOutputNames, onOutputNameChange,
        }} />
      }

    </Box >
  )
}

function displayNameFromCategory(category) {
  let name = ''
  if (category.name) {
    name = category.name
    if (category.info)
      name += ` (${category.info})`
  }
  if (category.left_name && category.right_name) {
    name += ` (${category.left_name}_${category.right_name})`
  }
  if (name === '') {
    name = category.key
  }
  return name.trim()
}

function categoriesFromSyntaxAndPlasmids(syntax, plasmids) {
  if (!syntax) {
    return []
  }
  const newCategories = syntax.parts.map((part) => ({
    ...part,
    left_name: syntax.overhangNames[part.left_overhang] || null,
    right_name: syntax.overhangNames[part.right_overhang] || null,
    key: `${part.left_overhang}-${part.right_overhang}`,
  }))
  let newCategoryKeys = newCategories.map((category) => category.key)
  plasmids.forEach((plasmid) => {
    if (!newCategoryKeys.includes(plasmid.key)) {
      const {left_overhang, right_overhang} = plasmid
      newCategories.push({
        left_overhang,
        right_overhang,
        left_name: syntax.overhangNames[left_overhang] || null,
        right_name: syntax.overhangNames[right_overhang] || null,
        key: `${left_overhang}-${right_overhang}`,
      })
      newCategoryKeys.push(`${left_overhang}-${right_overhang}`)
    }
  })
  newCategories.forEach((category, index) => {
    category.id = index + 1
    category.displayName = displayNameFromCategory(category)
  })
  return newCategories
}

function LoadSyntaxButton({ setSyntax, addPlasmids, clearPlasmids }) {
  const [existingSyntaxDialogOpen, setExistingSyntaxDialogOpen] = React.useState(false)
  const httpClient = useHttpClient();
  const { staticContentPath } = useConfig();
  const backendRoute = useBackendRoute();
  const { addAlert } = useCloningAlerts();
  const onSyntaxSelect = React.useCallback(async (syntax, plasmids) => {
    const url = backendRoute('validate_syntax');
    try {
      await httpClient.post(url, syntax);
      setSyntax(syntax)
      clearPlasmids()
      addPlasmids(plasmids)
    } catch (error) {
      addAlert({
        message: error2String(error),
        severity: 'error',
      });
    }
  }, [setSyntax, addPlasmids, clearPlasmids, httpClient, backendRoute, addAlert])
  return <>
    <Button color="success" onClick={() => setExistingSyntaxDialogOpen(true)}>Load Syntax</Button>
    {existingSyntaxDialogOpen && <ExistingSyntaxDialog
      staticContentPath={staticContentPath}
      onClose={() => setExistingSyntaxDialogOpen(false)}
      onSyntaxSelect={onSyntaxSelect}
      displayCreateYourOwnMessage={true}
    />}
  </>
}


function SyntaxOverviewButton({ syntax }) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState('detailed')
  const msa = React.useMemo(() => syntax ? graphToMSA(partsToGraph(syntax.parts)) : [], [syntax])
  return <>
    <Button color="success" onClick={() => setOpen(true)} data-testid="assembler-syntax-overview-button">Syntax Overview</Button>
    {open && <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      fullScreen
      maxWidth="xl"
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>Syntax overview</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Switch
              checked={mode === 'detailed'}
              onChange={(e) => setMode(e.target.checked ? 'detailed' : 'compact')}
            />
          }
          label={mode === 'compact' ? 'Compact' : 'Detailed'}
        />
        <SyntaxOverviewTable msa={msa} mode={mode} parts={syntax.parts} />
      </DialogContent>
    </Dialog>}
  </>
}

function Assembler() {
  const [syntax, setSyntax] = React.useState(null);
  const [plasmids, setPlasmids] = React.useState([])
  const { addAlert } = useCloningAlerts();
  const appInfo = useSelector(({ cloning }) => cloning.appInfo, isEqual);

  const categories = React.useMemo(() => {
    return categoriesFromSyntaxAndPlasmids(syntax, plasmids)
  }, [syntax, plasmids])

  const addPlasmids = React.useCallback((newPlasmids) => {
    setPlasmids((prevPlasmids) => {
      const maxId = Math.max(...prevPlasmids.map((plasmid) => plasmid.id), 0)
      return [...prevPlasmids, ...newPlasmids.map((plasmid, index) => ({ ...plasmid, id: maxId + index + 1 }))]
    })
  }, [])

  const clearLoadedPlasmids = React.useCallback(() => {
    setPlasmids(prev => prev.filter((plasmid) => plasmid.userUploaded !== true))
  }, [])

  const clearPlasmids = React.useCallback(() => {
    setPlasmids([])
  }, [])

  return (
    <>
      <Alert severity="warning" sx={{ maxWidth: '400px', margin: 'auto', fontSize: '.9rem', mb: 2 }}>
        The Assembler is experimental. Use with caution. Visit <a href="https://docs.opencloning.org/assembler" target="_blank">the documentation</a> for more information.
      </Alert>
      <ButtonGroup>
        <LoadSyntaxButton setSyntax={setSyntax} addPlasmids={addPlasmids} clearPlasmids={clearPlasmids} />
        {syntax && <SyntaxOverviewButton syntax={syntax} />}
        {syntax && <UploadPlasmidsButton addPlasmids={addPlasmids} syntax={syntax} />}
        {syntax && <Button color="error" onClick={clearLoadedPlasmids}>Remove uploaded plasmids</Button>}
      </ButtonGroup>
      {syntax && <AssemblerComponent plasmids={plasmids} syntax={syntax} categories={categories} assemblyEnzymes={syntax.assemblyEnzymes} addAlert={addAlert} appInfo={appInfo} />}
    </>
  )
}

export default Assembler
