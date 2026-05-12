import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function RequireAuth({ children }) {
  const user = useSelector((state) => state.auth.user);
  const workspaceId = useSelector((state) => state.auth.workspace?.id);
  const location = useLocation();

  // Token is being validated during bootstrap — don't redirect yet
  if (!user && !workspaceId) {
    const token = localStorage.getItem('token');
    if (token) return null;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !workspaceId) return null;

  return children;
}
