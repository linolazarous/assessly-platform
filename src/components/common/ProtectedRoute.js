import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ 
  roles, 
  redirectTo = '/login',
  unauthorizedRedirectTo = '/unauthorized'
}) {
  const { currentUser, loading, claims } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  if (!currentUser) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  if (roles && !roles.some(role => claims[`is${role}`])) {
    return (
      <Navigate 
        to={unauthorizedRedirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  return <Outlet />;
}

ProtectedRoute.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
  unauthorizedRedirectTo: PropTypes.string
};
