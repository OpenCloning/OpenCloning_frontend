import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Box, Button, TextField, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { fetchUserAndFirstWorkspace } from '../utils/auth_utils';
import useChangeWorkspace from '../hooks/useChangeWorkspace';

async function registerAndGetUser(email, displayName, password) {
  const { data: { access_token } } = await openCloningDBHttpClient.post(endpoints.authRegister, {
    email,
    display_name: displayName,
    password,
  });
  localStorage.setItem('token', access_token);
  return fetchUserAndFirstWorkspace();
}

export default function SignUpPage() {
  const { applySession } = useChangeWorkspace();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => registerAndGetUser(email, displayName, password),
    onSuccess: ({ user, workspace }) => {
      applySession(user, workspace);
      navigate('/sequences', { replace: true });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    setValidationError('');
    mutate();
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: 360, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h5" textAlign="center">
          Create account
        </Typography>
        {validationError && <Alert severity="error">{validationError}</Alert>}
        {error && <Alert severity="error">{error.response?.data?.detail ?? 'Sign up failed'}</Alert>}
        <TextField
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <TextField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? <CircularProgress size={24} /> : 'Sign up'}
        </Button>
        <Typography textAlign="center" variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
