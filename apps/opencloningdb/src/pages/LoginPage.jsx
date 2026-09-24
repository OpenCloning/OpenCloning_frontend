import React from 'react';
import { SignIn } from '@clerk/react';
import { Box, Typography } from '@mui/material';

export default function LoginPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 4 }}>
      <Typography sx={{ color: 'primary.main' }} variant="h1" textAlign="center">
        OpenCloningDB
      </Typography>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl="/sequences"
        forceRedirectUrl="/sequences"
      />
    </Box>
  );
}
