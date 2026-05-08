import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'react-redux';
import { Editor, updateEditor, addAlignment } from '@teselagen/ove';
import { Paper, IconButton } from '@mui/material';
import {Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon} from '@mui/icons-material';
import defaultMainEditorProps from '../config/defaultMainEditorProps';
import { updatePanelsShownWithAlignment, removePanelFromShown } from '@opencloning/utils/alignmentUtils';

const EDITOR_NAME = 'sequenceViewer';

const baseViewerProps = {
  ...defaultMainEditorProps,
  annotationVisibility: {featureTypesToHyde: {source: true}},
  readOnly: true,
  selectionLayer: {},
  sequenceData: {},
  ToolBarProps: {
    toolList: ['downloadTool', 'findTool', 'visibilityTool'],
  },
};

function SequenceViewer({ sequenceData, alignmentData }) {
  const store = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    if (sequenceData && Object.keys(sequenceData).length > 0) {
      const editorUpdate = {
        ...baseViewerProps,
        isFullscreen,
        sequenceData,
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
    }
  }, [sequenceData, store, isFullscreen, alignmentData]);

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
      <Editor
        editorName={EDITOR_NAME}
        {...viewerProps}
        height="800"
      />
    </Paper>
  );
}

export default React.memo(SequenceViewer);
