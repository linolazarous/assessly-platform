import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import { AccountCircle, ExitToApp, Settings } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from '../../assets/images/logo.png'; // Ensure logo.png exists in this path

export default function Navbar({ showNavigation }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Logo + Brand Name */}
          <Box 
            onClick={() => navigate('/')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              mr: 4 
            }}
          >
            <img 
              src={logo} 
              alt="Assessly Logo" 
              style={{ height: '40px', marginRight: '10px' }} 
            />
            <Typography 
              variant="h6" 
              component="h1"
              sx={{ fontWeight: 'bold' }}
            >
              Assessly
            </Typography>
          </Box>
          
          {showNavigation && currentUser && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button color="inherit" onClick={() => navigate('/assessments')}>
                Assessments
              </Button>
              <Button color="inherit" onClick={() => navigate('/reports')}>
                Reports
              </Button>
              <Button color="inherit" onClick={() => navigate('/templates')}>
                Templates
              </Button>
            </Box>
          )}
        </Box>
        
        {currentUser && (
          <Box>
            <IconButton
              size="large"
              edge="end"
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="account menu"
            >
              {currentUser.photoURL ? (
                <Avatar 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle fontSize="large" />
              )}
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: 3
                }
              }}
            >
              <MenuItem onClick={handleProfile}>
                <AccountCircle sx={{ mr: 1.5 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <Settings sx={{ mr: 1.5 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1.5 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

Navbar.propTypes = {
  showNavigation: PropTypes.bool
};

Navbar.defaultProps = {
  showNavigation: true
};

// In Navbar.js
import Logo from '../brand/Logo';

function Navbar() {
  return (
    <nav>
      <Logo size={40} className="logo-transition" />
    </nav>
  )
}
