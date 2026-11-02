import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Box, ButtonGroup } from '@mui/material';
import { useConfig } from '../../providers';
import useDatabase from '../../hooks/useDatabase';
import ServerStaticFileSelect from '../form/ServerStaticFileSelect';
import { usePlasmidsLogic } from './usePlasmidsLogic';
import PlasmidSyntaxTable from './PlasmidSyntaxTable';
import { jsonToGenbank } from '@teselagen/bio-parsers';

function formatPlasmid(sequenceData) {

  const { appData } = sequenceData;
  const { fileName, correspondingParts, longestFeature, databaseId, textFileSequence } = appData;
  const [left_overhang, right_overhang] = correspondingParts[0].split('-');
  
  let plasmidName = fileName;
  if (longestFeature[0]?.name) {
    plasmidName += ` (${longestFeature[0].name})`;
  }

  if (databaseId !== undefined) {
    return {
      type: 'databaseSequence',
      plasmid_name: plasmidName,
      database_id: databaseId,
      left_overhang,
      right_overhang,
      key: `${left_overhang}-${right_overhang}`,
      sequenceData,
      textFileSequence,
      userUploaded: true,
    };
  }
  
  return {
    type: 'loadedFile',
    plasmid_name: plasmidName,
    file_name: fileName,
    left_overhang,
    right_overhang,
    key: `${left_overhang}-${right_overhang}`,
    sequenceData,
    genbankString: jsonToGenbank(sequenceData),
    userUploaded: true,
  };
  
}

export function UploadPlasmidsFromLocalServerButton({ handleFileChange }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [error, setError] = React.useState(null);
  const {staticContentPath} = useConfig();
  
  const onFileSelected = React.useCallback(async (files) => {
    try {
      await handleFileChange(files)
      setDialogOpen(false)
    } catch (e) {
      setError(e.message)
    }
  }, [handleFileChange, setError])
  
  if (!staticContentPath) {
    return null;
  }
  
  return <>
    <Button color="primary" onClick={() => {setError(null); setDialogOpen(true)}}>
          Load Plasmids from Local Server
    </Button>
    {dialogOpen && <Dialog open onClose={() => {setError(null); setDialogOpen(false)}}>
      <DialogTitle>Load Plasmids from Local Server</DialogTitle>
      <DialogContent sx={{ width: '500px' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <ServerStaticFileSelect onFileSelected={onFileSelected} type="sequence" multiple />
      </DialogContent>
    </Dialog>}
  </>
}
  
export function UploadPlasmidsFromDatabaseButton({ onSequencesLoaded }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [error, setError] = React.useState(null);
  const database = useDatabase();

  const handleSequencesLoaded = React.useCallback(async (sequences) => {
    try {
      await onSequencesLoaded(sequences)
      setDialogOpen(false)
    } catch (e) {
      setError(e.message)
    }
  }, [onSequencesLoaded, setError])

  const GetSequencesInBulkComponent = database?.GetSequencesInBulkComponent;
  if (!GetSequencesInBulkComponent) {
    return null;
  }

  return <>
    <Button color="primary" onClick={() => {setError(null); setDialogOpen(true)}}>
          Load Plasmids from {database.name}
    </Button>
    {dialogOpen && <Dialog open onClose={() => {setError(null); setDialogOpen(false)}}>
      <DialogTitle>Load Plasmids from {database.name}</DialogTitle>
      <DialogContent sx={{ width: '500px' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <GetSequencesInBulkComponent onSequencesLoaded={handleSequencesLoaded} />
      </DialogContent>
    </Dialog>}
  </>
}

function UploadPlasmidsButton({ addPlasmids, syntax }) {
  const { uploadPlasmids, loadPlasmidsFromDatabase, linkedPlasmids, setLinkedPlasmids } = usePlasmidsLogic(syntax)
  const validPlasmids = React.useMemo(() => linkedPlasmids.filter((plasmid) => plasmid.appData.correspondingParts.length === 1), [linkedPlasmids])
  const invalidPlasmids = React.useMemo(() => linkedPlasmids.filter((plasmid) => plasmid.appData.correspondingParts.length !== 1), [linkedPlasmids])
  const fileInputRef = React.useRef(null)
  
  const handleFileChange = async (files) => {
    fileInputRef.current.value = ''
    await uploadPlasmids(Array.from(files))
  }
  
  const handleImportValidPlasmids = React.useCallback(() => {
    addPlasmids(validPlasmids.map(formatPlasmid))
    setLinkedPlasmids([])
  }, [addPlasmids, validPlasmids, setLinkedPlasmids])
  
  return (<>
    <Button color="primary" onClick={() => fileInputRef.current.click()}>
          Add Plasmids
    </Button>
    <input multiple type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(event) => handleFileChange(Array.from(event.target.files))} accept=".gbk,.gb,.fasta,.fa,.dna" />
    <UploadPlasmidsFromLocalServerButton handleFileChange={handleFileChange} />
    <UploadPlasmidsFromDatabaseButton onSequencesLoaded={loadPlasmidsFromDatabase} />
    <Dialog
      maxWidth="lg"
      fullWidth
      open={invalidPlasmids.length > 0 || validPlasmids.length > 0}
      onClose={() => setLinkedPlasmids([])}
      PaperProps={{
        style: {
          maxHeight: '80vh',
        },
      }}
    >
      <DialogActions sx={{ justifyContent: 'center', position: 'sticky', top: 0, zIndex: 99, background: '#fff', py: 2 }}>
        <Button sx={{ p: 1.5, fontSize: '1rem' }} disabled={validPlasmids.length === 0} variant="contained" color="success" onClick={handleImportValidPlasmids}>Import valid plasmids</Button>
        <Button sx={{ p: 1.5, fontSize: '1rem' }} variant="contained" color="error" onClick={() => setLinkedPlasmids([])}>Cancel</Button>
      </DialogActions>
      {invalidPlasmids.length > 0 && (
        <Box data-testid="invalid-plasmids-box">
          <DialogTitle>Invalid Plasmids</DialogTitle>
          <DialogContent>
            <PlasmidSyntaxTable plasmids={invalidPlasmids} />
          </DialogContent>
        </Box>
      )}
      {validPlasmids.length > 0 && (
        <Box data-testid="valid-plasmids-box">
          <DialogTitle>Valid Plasmids</DialogTitle>
          <DialogContent>
            <PlasmidSyntaxTable plasmids={validPlasmids} />
          </DialogContent>
        </Box>
      )}
    </Dialog>
  </>)
}

export default UploadPlasmidsButton
