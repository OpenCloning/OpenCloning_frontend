import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useStore } from 'react-redux';
import { Editor, updateEditor, addAlignment } from '@teselagen/ove';
import { Paper, IconButton, Alert, Button } from '@mui/material';
import {Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon} from '@mui/icons-material';
import defaultMainEditorProps from '../config/defaultMainEditorProps';
import { updatePanelsShownWithAlignment, removePanelFromShown } from '@opencloning/utils/alignmentUtils';

const EDITOR_NAME = 'sequenceViewer';


function regionRightClickedOverride(items, { annotation }, props) {
  const items2keep = items.filter((i) => i.text === 'Copy');
  return [
    ...items2keep,
    {
      text: 'Create',
      submenu: [
        "newFeature",
      ],
    },
    ...(props.sequenceData.circular === true ? [
      "--",
      "selectInverse",
      "--",
    ] : []),
  ];
}

function primerRightClickedOverride(items, { annotation }, props) {
  return [
    ...regionRightClickedOverride(items, { annotation }, props),
    "--",
    {
      text: 'Delete Primer annotation',
      cmd: 'deletePrimer',
    }
  ];
}

function featureRightClickedOverride(items, { annotation }, props) {
  return [
    ...regionRightClickedOverride(items, { annotation }, props),
    "--",
    "editFeature",
    "deleteFeature",
    "showRemoveDuplicatesDialogFeatures",
    "--",
    "toggleCdsFeatureTranslations",
    "viewFeatureProperties",
    "--",
  ];
}
const rightClickOverrides = {
  selectionLayerRightClicked: regionRightClickedOverride,
  primerRightClicked: primerRightClickedOverride,
  translationRightClicked: regionRightClickedOverride,
  searchLayerRightClicked: regionRightClickedOverride,
  featureRightClicked: featureRightClickedOverride,
  partRightClicked: {},
  orfRightClicked: {},
  backgroundRightClicked: {},
};

const baseViewerProps = {
  ...defaultMainEditorProps,
  annotationVisibility: {featureTypesToHyde: {source: true}},
  readOnly: false,
  disableBpEditing: true,
  selectionLayer: {},
  sequenceData: {},
  ToolBarProps: {
    toolList: ['downloadTool', 'findTool', 'visibilityTool', 'undoTool', 'redoTool'],
  },
  rightClickOverrides,
};

function SequenceViewer({ sequenceData, alignmentData }) {
  const store = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const annotationChanged = useSelector(
    (state) => {
      const history = state.VectorEditor.sequenceViewer?.sequenceDataHistory;
      if (!history) return false;
      return Object.keys(history).length > 0 && history.past.length !== 0;
    }
  );

  const annotationChangedAlert = annotationChanged && (
    <Alert
      style={{maxWidth: '500px', margin: '10px auto'}}
      severity="info"
      data-testid="annotation-changed-alert"
      action={
        <>
          <Button color="primary" onClick={null}>
              Save
          </Button>
          <Button color="secondary" onClick={null}>
              Cancel
          </Button>
        </>
      }
    >
      <strong>Annotation Changed</strong>
    </Alert>
  );

  React.useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const viewerProps = {
    ...baseViewerProps,
    isFullscreen,
  };

  React.useEffect(() => {
    updateEditor(store, EDITOR_NAME, { ...baseViewerProps, sequenceData });
  }, [store, sequenceData]);

  React.useEffect(() => {
    const editorUpdate = {
      isFullscreen,
    };

    if (alignmentData) {
      addAlignment(store, alignmentData);
      const editorState = store.getState().VectorEditor?.[EDITOR_NAME];
      const currentPanels = editorState?.panelsShown || [[]];
      editorUpdate.panelsShown = updatePanelsShownWithAlignment(currentPanels);
    } else {
      const editorState = store.getState().VectorEditor?.[EDITOR_NAME];
      if (editorState?.panelsShown) {
        editorUpdate.panelsShown = removePanelFromShown(editorState.panelsShown, 'simpleAlignment');
      }
    }

    editorUpdate.panelsShown[0].find((panel) => panel.id === 'rail').active = !sequenceData.circular;
    editorUpdate.panelsShown[0].find((panel) => panel.id === 'circular').active = sequenceData.circular;

    updateEditor(store, EDITOR_NAME, editorUpdate);

  }, [sequenceData.circular, store, isFullscreen, alignmentData]);

  if (!sequenceData || !sequenceData.sequence) {
    return null;
  }

  const fullscreenExitButton = isFullscreen && createPortal(
    <IconButton
      aria-label="Exit fullscreen"
      onClick={() => setIsFullscreen(false)}
      sx={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 2147483647,
        bgcolor: 'background.paper',
        boxShadow: 3,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <FullscreenExitIcon />
    </IconButton>,
    document.body,
  );

  return (
    <Paper sx={{ p: 1, overflow: 'auto', position: 'relative' }}>
      {!isFullscreen && (
        <IconButton
          aria-label="Fullscreen"
          onClick={() => setIsFullscreen(true)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <FullscreenIcon />
        </IconButton>
      )}
      {fullscreenExitButton}
      {annotationChangedAlert}
      <Editor
        editorName={EDITOR_NAME}
        {...viewerProps}
        height="800"
      />
    </Paper>
  );
}

export default React.memo(SequenceViewer);
