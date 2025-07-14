import React from 'react';
import { 
  Box,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import Testimonials from './components/Testimonials';
import CallToAction from './components/CallToAction';
import Footer from '../../components/common/Footer';

const LandingScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default
    }}>
      {/* Main Content */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          flex: 1,
          px: isMobile ? 2 : 4,
          py: isMobile ? 3 : 6
        }}
      >
        <HeroSection />
        <FeaturesSection />
        <Testimonials />
        <CallToAction />
      </Container>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default LandingScreen;
