import { useEffect } from 'react';
import { setUnauthorizedHandler } from '@opencloning/opencloningdb';
import { useOidcAuth } from '../auth/OidcAuthContext';
import useChangeWorkspace from './useChangeWorkspace';
import { fetchUserAndFirstWorkspace } from '../utils/auth_utils';

export default function useAuthBootstrap() {
  const { isLoaded, isSignedIn, getToken } = useOidcAuth();
  const { applySession, logout } = useChangeWorkspace();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    if (!isLoaded) return undefined;

    if (!isSignedIn) {
      localStorage.removeItem('token');
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken( {template: 'default'});
        if (cancelled || !token) return;

        localStorage.setItem('token', token);
        const { user, workspace } = await fetchUserAndFirstWorkspace();
        if (!cancelled) {
          applySession(user, workspace);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('token');
        }
      }
    })();

    // This runs if the user is signed out or the component is unmounted
    // to stop the effect from running
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, applySession]);
}
