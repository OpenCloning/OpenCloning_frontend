import { useEffect } from 'react';
import { setUnauthorizedHandler } from '@opencloning/opencloningdb';
import useChangeWorkspace from './useChangeWorkspace';
import { fetchUserAndFirstWorkspace } from '../utils/auth_utils';

export default function useAuthBootstrap() {
  const { applySession, logout } = useChangeWorkspace();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const { user, workspace } = await fetchUserAndFirstWorkspace();
        applySession(user, workspace);
      } catch {
        localStorage.removeItem('token');
      }
    })();
  }, [applySession, logout]);
}
