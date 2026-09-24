import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { OidcAuthContext } from '../OidcAuthContext';
import { TEST_USERS } from '../testUsers';

const TestSignInContext = createContext(null);

export function TestOidcAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const signIn = useCallback((nextToken) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      isLoaded: true,
      isSignedIn: Boolean(token),
      getToken: async () => token,
      signOut,
    }),
    [token, signOut],
  );

  return (
    <OidcAuthContext.Provider value={value}>
      <TestSignInContext.Provider value={signIn}>
        {children}
      </TestSignInContext.Provider>
    </OidcAuthContext.Provider>
  );
}

export function TestLoginPage() {
  const signIn = useContext(TestSignInContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const user = TEST_USERS.find((candidate) => candidate.id === selectedId);
    if (!user || !signIn) return;

    signIn(user.token);
    const from = location.state?.from;
    const destination = from
      ? `${from.pathname}${from.search || ''}`
      : '/sequences';
    navigate(destination, { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 4 }}>
      <Typography sx={{ color: 'primary.main' }} variant="h1" textAlign="center">
        OpenCloningDB
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 320 }}>
        <FormControl fullWidth>
          <InputLabel id="test-oidc-user-label">User</InputLabel>
          <Select
            labelId="test-oidc-user-label"
            label="User"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            data-testid="test-oidc-user-select"
          >
            {TEST_USERS.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          data-testid="test-oidc-sign-in"
          disabled={!selectedId}
        >
          Sign in
        </Button>
      </Box>
    </Box>
  );
}
