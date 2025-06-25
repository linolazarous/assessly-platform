// src/components/common/ProtectedRoute.js
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';

export default function ProtectedRoute({ roles, redirectTo = '/login' }) {
  const { currentUser, loading, ...claims } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!currentUser) return <Navigate to={redirectTo} replace />;

  if (roles && !roles.some(role => claims[`is${role}`])) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}