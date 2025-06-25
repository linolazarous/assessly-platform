// src/components/common/Navbar.jsx
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Assessment App
        </Typography>
        {currentUser && (
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}