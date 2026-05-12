import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import { DatabaseProvider } from '@opencloning/ui/providers/DatabaseContext';
import AppAlerts from './components/AppAlerts';
import AppBarUserMenu from './components/AppBarUserMenu';
import SwitchWorkspaceDialog from './components/SwitchWorkspaceDialog';
import RequireAuth from './components/RequireAuth';
import { OpenCloningDBInterface } from '@opencloning/opencloningdb';
import useAuthBootstrap from './hooks/useAuthBootstrap';
import useChangeWorkspace from './hooks/useChangeWorkspace';
import SequencesPage from './pages/SequencesPage';
import PrimersPage from './pages/PrimersPage';
import DesignPage from './pages/DesignPage';
import SequenceDetailPage from './pages/SequenceDetailPage';
import PrimerDetailPage from './pages/PrimerDetailPage';
import LinesPage from './pages/LinesPage';
import LineDetailPage from './pages/LineDetailPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import WorkspacePage from './pages/WorkspacePage';

const queryClient = new QueryClient();

const config = {
  backendUrl: 'http://localhost:8000',
  showAppBar: false,
  enableAssembler: false,
  enablePlannotate: false,
};

const TABS = ['/sequences', '/primers', '/lines', '/design'];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useChangeWorkspace();
  const user = useSelector((state) => state.auth.user);
  const workspaceName = useSelector((state) => state.auth.workspace?.name);
  const [isSwitchWorkspaceDialogOpen, setIsSwitchWorkspaceDialogOpen] = useState(false);
  const currentTab = TABS.find((tab) => location.pathname === tab || location.pathname.startsWith(`${tab}/`)) ?? false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', overflowX: 'auto' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ mr: 4, color: 'white' }}>
            OpenCloning
          </Typography>
          <Tabs
            data-testid="opencloningdb-app-tabs"
            value={currentTab}
            onChange={(_, newValue) => navigate(newValue)}
            textColor="inherit"
            TabIndicatorProps={{
              sx: {
                backgroundColor: 'white',
              },
            }}
          >
            <Tab label="Sequences" value="/sequences" />
            <Tab label="Primers" value="/primers" />
            <Tab label="Lines" value="/lines" />
            <Tab label="Design" value="/design" />
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
          <AppBarUserMenu
            userName={user.display_name}
            workspaceName={workspaceName}
            onLogout={logout}
            onSwitchWorkspaceClick={() => setIsSwitchWorkspaceDialogOpen(true)}
            onManageWorkspacesClick={() => navigate('/workspace')}
          />
        </Toolbar>
      </AppBar>
      <SwitchWorkspaceDialog
        open={isSwitchWorkspaceDialogOpen}
        onClose={() => setIsSwitchWorkspaceDialogOpen(false)}
      />
      <Box sx={{zIndex: 9000}}>
        <AppAlerts />
      </Box>
      <Routes>
        <Route path="/" element={<Navigate to="/sequences" replace />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/sequences" element={<SequencesPage />} />
        <Route path="/sequences/:id" element={<SequenceDetailPage />} />
        <Route path="/primers" element={<PrimersPage />} />
        <Route path="/primers/:id" element={<PrimerDetailPage />} />
        <Route path="/lines" element={<LinesPage />} />
        <Route path="/lines/:id" element={<LineDetailPage />} />
      </Routes>
    </Box>
  );
}

function AppRoutes() {
  useAuthBootstrap();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider config={config}>
          <DatabaseProvider value={OpenCloningDBInterface}>
            <AppRoutes />
          </DatabaseProvider>
        </ConfigProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
