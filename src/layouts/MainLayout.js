// src/layouts/MainLayout.jsx
import { Box } from '@mui/material';
import Navbar from '../components/common/Navbar';

export default function MainLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}