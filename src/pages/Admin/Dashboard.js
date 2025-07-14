import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Grid, 
  Paper,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  orderBy,
  limit
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import AssessmentChart from '../../components/admin/AssessmentChart';
import UserActivityWidget from '../../components/admin/UserActivityWidget';
import IconButton from '@mui/material/IconButton';

export default function AdminDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser, claims } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    assessments: 0,
    activeUsers: 0,
    organizations: 0,
    completions: 0
  });

  // Get all assessments
  const [assessments, assessmentsLoading, assessmentsError] = useCollection(
    query(
      collection(db, 'assessments'),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Load summary statistics
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      
      const [assessmentsCount, usersCount, orgsCount, completionsCount] = await Promise.all([
        getCountFromServer(collection(db, 'assessments')),
        getCountFromServer(query(collection(db, 'users'), where('active', '==', true))),
        getCountFromServer(collection(db, 'organizations')),
        getCountFromServer(collection(db, 'assessmentResponses'))
      ]);

      setStats({
        assessments: assessmentsCount.data().count,
        activeUsers: usersCount.data().count,
        organizations: orgsCount.data().count,
        completions: completionsCount.data().count
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      enqueueSnackbar('Failed to load dashboard statistics', { 
        variant: 'error',
        autoHideDuration: 3000
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (!claims?.admin) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          You don't have permission to access this page
        </Typography>
      </Box>
    );
  }

  if (assessmentsError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Error loading assessments: {assessmentsError.message}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={loadStats}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Admin Dashboard
        </Typography>
        <IconButton 
          onClick={loadStats}
          aria-label="refresh"
          disabled={loadingStats}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {loadingStats && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assessments"
            value={stats.assessments}
            icon={<AssessmentIcon color="primary" />}
            loading={loadingStats}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<PeopleIcon color="secondary" />}
            loading={loadingStats}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Organizations"
            value={stats.organizations}
            icon={<BusinessIcon color="success" />}
            loading={loadingStats}
            trend="neutral"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completions"
            value={stats.completions}
            icon={<AssessmentIcon color="info" />}
            loading={loadingStats}
            trend="up"
          />
        </Grid>
      </Grid>

      <Grid container spacing={isMobile ? 1 : 3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ 
            p: 2, 
            height: '100%',
            borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom>
              Recent Assessments
            </Typography>
            {assessmentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <AssessmentChart assessments={assessments} />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ 
            p: 2, 
            height: '100%',
            borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom>
              User Activity
            </Typography>
            <UserActivityWidget />
          </Paper>
        </Grid>
      </Grid>

      {/* Mobile-only controls */}
      {isMobile && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained"
            onClick={loadStats}
            startIcon={<RefreshIcon />}
          >
            Refresh Data
          </Button>
        </Box>
      )}
    </Box>
  );
}

function StatCard({ title, value, icon, loading, trend }) {
  const theme = useTheme();
  const trendColors = {
    up: theme.palette.success.main,
    down: theme.palette.error.main,
    neutral: theme.palette.warning.main
  };

  return (
    <Paper elevation={2} sx={{ 
      p: 3, 
      height: '100%',
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
      '&:after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: trendColors[trend] || 'transparent'
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {loading ? '--' : value.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: theme.palette.primary.main
        }}>
          {React.cloneElement(icon, { fontSize: 'large' })}
        </Box>
      </Box>
    </Paper>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  trend: PropTypes.oneOf(['up', 'down', 'neutral'])
};

StatCard.defaultProps = {
  loading: false,
  trend: 'neutral'
};
