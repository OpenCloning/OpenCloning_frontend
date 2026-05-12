import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Box, Button, TextField, Typography, Paper, Divider } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { setWorkspace } from '../store/authSlice';
import useChangeWorkspace from '../hooks/useChangeWorkspace';
import useAppAlerts from '../hooks/useAppAlerts';
import PageContainer from '../components/PageContainer';

function SectionBox({ title, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3, maxWidth: 500 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

function CreateWorkspaceSection() {
  const { changeWorkspace } = useChangeWorkspace();
  const { addAlert } = useAppAlerts();
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: async (workspaceName) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.postWorkspace, { name: workspaceName });
      return data;
    },
    onSuccess: (data) => {
      changeWorkspace({ id: data.id, name: data.name, role: data.role ?? null });
      setName('');
      addAlert({ message: `Workspace "${data.name}" created and activated`, severity: 'success' });
    },
    onError: () => {
      addAlert({ message: 'Failed to create workspace', severity: 'error' });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(name.trim());
  }

  return (
    <SectionBox title="Create workspace">
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!name.trim() || createMutation.isPending}
        >
          Create
        </Button>
      </Box>
    </SectionBox>
  );
}

function RenameWorkspaceSection() {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.auth.workspace);
  const workspaceId = workspace?.id;
  const workspaceName = workspace?.name;
  const { addAlert } = useAppAlerts();
  const [name, setName] = useState(workspaceName ?? '');

  const renameMutation = useMutation({
    mutationFn: async (newName) => {
      const { data } = await openCloningDBHttpClient.patch(endpoints.workspace(workspaceId), { name: newName });
      return data;
    },
    onSuccess: (data) => {
      if (!workspace) return;
      dispatch(setWorkspace({ ...workspace, name: data.name }));
      addAlert({ message: 'Workspace renamed successfully', severity: 'success' });
    },
    onError: () => {
      addAlert({ message: 'Failed to rename workspace', severity: 'error' });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === workspaceName) return;
    renameMutation.mutate(trimmed);
  }

  return (
    <SectionBox title="Rename current workspace">
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!name.trim() || name.trim() === workspaceName || renameMutation.isPending}
        >
          Rename
        </Button>
      </Box>
    </SectionBox>
  );
}

function InviteSection() {
  return (
    <SectionBox title="Invite to workspace">
      <Typography variant="body2" color="text.secondary">
        Invite links are coming soon. Members will be able to join your workspace via a shareable link.
      </Typography>
    </SectionBox>
  );
}

export default function WorkspacePage() {
  const workspace = useSelector((state) => state.auth.workspace);
  const workspaceId = workspace?.id;
  const workspaceRole = workspace?.role;
  const isOwner = workspaceRole === 'owner';

  return (
    <PageContainer>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Manage workspaces
      </Typography>
      <CreateWorkspaceSection />
      {isOwner && <RenameWorkspaceSection key={workspaceId ?? 'none'} />}
      {isOwner && <InviteSection />}
    </PageContainer>
  );
}
