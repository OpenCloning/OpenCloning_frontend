import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { InputLabel, MenuItem, FormControl, Select } from '@mui/material';
import { getInputSequencesFromSourceId } from '@opencloning/store/cloning_utils';
import { cloningActions } from '@opencloning/store/cloning';
import useDatabase from '../../hooks/useDatabase';
import { useConfig } from '../../hooks/useConfig';

const { replaceSource } = cloningActions;

// Not a source type of its own: it is an AnnotationSource with the primer_binding_sites tool
const MAP_PRIMERS_OPTION = 'MapPrimers';

function SourceTypeSelector({ source }) {
  const { id: sourceId, type: sourceType } = source;
  const dispatch = useDispatch();
  const database = useDatabase();
  const sourceIsPrimerDesign = useSelector((state) => Boolean(state.cloning.sequences.find((e) => e.id === source.id)?.primer_design));
  const { noExternalRequests, enablePlannotate, staticContentPath } = useConfig();

  // Both annotation tools are AnnotationSource, but they are listed separately because they
  // do unrelated things. The tool is picked here rather than inside the source form.
  const isMapPrimers = sourceType === 'AnnotationSource' && source.annotation_tool === 'primer_binding_sites';
  const selectValue = isMapPrimers ? MAP_PRIMERS_OPTION : (sourceType || '');

  const onChange = (event) => {
    const { value } = event.target;
    // Clear the source other than these fields
    const newSource = { id: sourceId, type: value, input: source.input };
    if (value === MAP_PRIMERS_OPTION) {
      newSource.type = 'AnnotationSource';
      newSource.annotation_tool = 'primer_binding_sites';
    } else if (value === 'AnnotationSource') {
      newSource.annotation_tool = 'plannotate';
    }
    dispatch(replaceSource(newSource));
  };
  const inputSequences = useSelector((state) => getInputSequencesFromSourceId(state, sourceId), shallowEqual);
  const sequencesExist = useSelector((state) => state.cloning.sequences.length > 0, shallowEqual);
  const options = [];
  if (inputSequences.length === 0) {
    options.push(<MenuItem key="UploadedFileSource" value="UploadedFileSource">Submit file</MenuItem>);
    if (staticContentPath) {
      options.push(<MenuItem key="LocalFileSource" value="LocalFileSource">Local server file</MenuItem>);
    }
    if (!noExternalRequests) {
      options.push(<MenuItem key="RepositoryIdSource" value="RepositoryIdSource">Repository</MenuItem>);
      options.push(<MenuItem key="GenomeCoordinatesSource" value="GenomeCoordinatesSource">Genome region</MenuItem>);
    }
    options.push(<MenuItem key="ManuallyTypedSource" value="ManuallyTypedSource">Enter manually</MenuItem>);
    options.push(<MenuItem key="OligoHybridizationSource" value="OligoHybridizationSource">Oligonucleotide hybridization</MenuItem>);
    if (database) {
      options.push(<MenuItem key="DatabaseSource" value="DatabaseSource">{`Import from ${database.name}`}</MenuItem>);
    }
    if (sequencesExist) {
      options.push(<MenuItem key="CopySequence" value="CopySequence">Use an existing sequence</MenuItem>);
    }
  } else {
    // See https://github.com/OpenCloning/OpenCloning_frontend/issues/101
    if (inputSequences.length < 2) {
      options.push(<MenuItem key="RestrictionEnzymeDigestionSource" value="RestrictionEnzymeDigestionSource">Restriction</MenuItem>);
      options.push(<MenuItem key="PCRSource" value="PCRSource">PCR</MenuItem>);
      options.push(<MenuItem key="PolymeraseExtensionSource" value="PolymeraseExtensionSource">Polymerase extension</MenuItem>);
      options.push(<MenuItem key="ReverseComplementSource" value="ReverseComplementSource">Reverse complement</MenuItem>);
      // Mapping primers needs no external service, so unlike pLannotate it is always available
      options.push(<MenuItem key={MAP_PRIMERS_OPTION} value={MAP_PRIMERS_OPTION}>Map all primers</MenuItem>);
      if (enablePlannotate) {
        options.push(<MenuItem key="AnnotationSource" value="AnnotationSource">Annotate features</MenuItem>);
      }
    }
    options.push(<MenuItem key="LigationSource" value="LigationSource">Ligation (sticky / blunt)</MenuItem>);
    options.push(<MenuItem key="GibsonAssemblySource" value="GibsonAssemblySource">Gibson assembly</MenuItem>);
    options.push(<MenuItem key="HomologousRecombinationSource" value="HomologousRecombinationSource">Homologous recombination</MenuItem>);
    options.push(<MenuItem key="CRISPRSource" value="CRISPRSource">CRISPR</MenuItem>);
    options.push(<MenuItem key="RestrictionAndLigationSource" value="RestrictionAndLigationSource">Restriction + ligation / Golden Gate</MenuItem>);
    options.push(<MenuItem key="OverlapExtensionPCRLigationSource" value="OverlapExtensionPCRLigationSource">Join overlap extension PCR fragments</MenuItem>);
    options.push(<MenuItem key="InFusionSource" value="InFusionSource">In-Fusion</MenuItem>);
    options.push(<MenuItem key="InVivoAssemblySource" value="InVivoAssemblySource">In vivo assembly</MenuItem>);
    options.push(<MenuItem key="GatewaySource" value="GatewaySource">Gateway</MenuItem>);
    options.push(<MenuItem key="CreLoxRecombinationSource" value="CreLoxRecombinationSource">Cre/Lox recombination</MenuItem>);
    options.push(<MenuItem key="RecombinaseSource" value="RecombinaseSource">Recombinase</MenuItem>);
  }

  // Sort options by text content
  options.sort((a, b) => a.props.children.localeCompare(b.props.children));

  return (
    <>
      {!sourceType && (<h2 className="empty-source-title">{inputSequences.length === 0 ? 'Import a sequence' : 'Use this sequence'}</h2>)}
      <FormControl fullWidth>
        <InputLabel id={`select-source-${sourceId}-label`}>Source type</InputLabel>
        <Select
          value={selectValue}
          onChange={onChange}
          labelId={`select-source-${sourceId}-label`}
          // Note how you have to set the label in two places
          // see https://stackoverflow.com/questions/67064682/material-ui-outlined-select-label-is-not-rendering-properly
          label="Source type"
          disabled={sourceIsPrimerDesign}
        >
          {options}
        </Select>
      </FormControl>
    </>

  );
}

export default SourceTypeSelector;
