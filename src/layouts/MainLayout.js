import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import PropTypes from 'prop-types';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout({ children }) {
  const { currentUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar 
        showNavigation={!!currentUser}
        onDrawerToggle={handleDrawerToggle} 
      />
      
      {currentUser && (
        <Sidebar 
          mobileOpen={mobileOpen} 
          onDrawerToggle={handleDrawerToggle} 
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          maxWidth: `calc(100vw - ${currentUser ? 240 : 0}px)`,
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ml: { sm: currentUser ? '240px' : 0 }
        }}
      >
        <Toolbar /> {/* Spacer for Navbar */}
        {children}
      </Box>
    </Box>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired
};
