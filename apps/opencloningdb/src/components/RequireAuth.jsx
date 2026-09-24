import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/react';

export default function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const workspaceId = useSelector((state) => state.auth.workspace?.id);
  const location = useLocation();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !workspaceId) return null;

  return children;
}
