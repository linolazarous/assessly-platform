import React from 'react';
import { Box } from '@mui/material';

export const Logo = ({ size = 40, withText = true, darkMode = false }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* SVG Logo - Replace with your actual logo */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Base */}
        <path 
          d="M50 5L10 25V60C10 80 50 95 50 95S90 80 90 60V25L50 5Z" 
          fill={darkMode ? "#ffffff" : "url(#gradient)"} 
        />
        {/* Checkmark */}
        <path 
          d="M30 50L45 65L70 35" 
          stroke={darkMode ? "#3f51b5" : "#ffffff"} 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        {/* Gradient */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f51b5" />
            <stop offset="100%" stopColor="#4caf50" />
          </linearGradient>
        </defs>
      </svg>

      {withText && (
        <Box 
          component="span"
          sx={{ 
            fontWeight: 700,
            fontSize: size * 0.5,
            background: darkMode 
              ? 'linear-gradient(45deg, #ffffff 30%, #c3cfe2 90%)'
              : 'linear-gradient(45deg, #3f51b5 30%, #4caf50 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Assessly
        </Box>
      )}
    </Box>
  );
};