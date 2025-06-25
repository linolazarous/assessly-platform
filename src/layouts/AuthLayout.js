// src/layouts/AuthLayout.jsx
import { Box } from '@mui/material';

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: (theme) => theme.palette.background.default
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 450, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}