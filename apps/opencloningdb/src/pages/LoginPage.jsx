import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Box, Button, TextField, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { fetchUserAndFirstWorkspace } from '../utils/auth_utils';
import useChangeWorkspace from '../hooks/useChangeWorkspace';

async function loginAndGetUser(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const { data: { access_token: accessToken } } = await openCloningDBHttpClient.post(endpoints.authToken, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  localStorage.setItem('token', accessToken);
  return fetchUserAndFirstWorkspace();
}

export default function LoginPage() {
  const { applySession } = useChangeWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/sequences';


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => loginAndGetUser(email, password),
    onSuccess: ({ user, workspace }) => {
      applySession(user, workspace);
      navigate(from, { replace: true });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutate();
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 4 }}>
      <Typography sx={{color: 'primary.main'}} variant="h1" textAlign="center" >
        OpenCloningDB
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: 360, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h5" textAlign="center">
          Sign in
        </Typography>
        {error && <Alert severity="error">{error.response?.data?.detail ?? 'Login failed'}</Alert>}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? <CircularProgress size={24} /> : 'Sign in'}
        </Button>
        <Typography textAlign="center" variant="body2">
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} to="/signup">
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
