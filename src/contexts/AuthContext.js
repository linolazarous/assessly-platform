import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { CircularProgress, Box } from '@mui/material';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Refresh user claims when needed
  const refreshClaims = async () => {
    if (!currentUser) return;
    try {
      await currentUser.getIdToken(true); // Force token refresh
      const tokenResult = await currentUser.getIdTokenResult();
      setClaims(tokenResult.claims);
      setToken(tokenResult.token);
    } catch (error) {
      console.error('Error refreshing claims:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const tokenResult = await user.getIdTokenResult();
          setCurrentUser(user);
          setClaims(tokenResult.claims);
          setToken(tokenResult.token);
        } else {
          setCurrentUser(null);
          setClaims(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setCurrentUser(null);
        setClaims(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    currentUser,
    claims,
    token,
    loading,
    signOut,
    refreshClaims,
    isAdmin: claims?.admin === true,
    isAssessor: claims?.assessor === true,
    isCandidate: claims?.candidate === true,
    getOrgRole: (orgId) => claims?.orgRoles?.[orgId] || null,
    hasPermission: (permission) => claims?.permissions?.includes(permission) || false
  }), [currentUser, claims, token, loading]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'background.default'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
