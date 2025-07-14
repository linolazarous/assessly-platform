import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

export default function RoleGuard({ children, requiredRole, organizationId }) {
  const { currentUser, claims } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const roleKey = organizationId ? `org_${organizationId}_role` : 'globalRole';
  const userRole = claims?.[roleKey];

  if (userRole !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

RoleGuard.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string.isRequired,
  organizationId: PropTypes.string
};
