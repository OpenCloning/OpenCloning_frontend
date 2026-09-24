import React from 'react';
import { SignUp } from '@clerk/react';
import { Box, Typography } from '@mui/material';

export default function SignUpPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 4 }}>
      <Typography sx={{ color: 'primary.main' }} variant="h1" textAlign="center">
        OpenCloningDB
      </Typography>
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/sequences"
        forceRedirectUrl="/sequences"
      />
    </Box>
  );
}
