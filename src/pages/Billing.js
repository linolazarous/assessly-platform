import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import { db } from '../../firebase/firebase';
import { redirectToCheckout } from '../../services/subscriptions';
import BillingHistory from '../../components/billing/BillingHistory';
import PaymentMethods from '../../components/billing/PaymentMethods';

export default function Billing({ orgId }) {
  const [orgDoc, orgLoading, orgError] = useDocument(doc(db, `organizations/${orgId}`));
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleUpgrade = async (priceId) => {
    try {
      setLoading(true);
      await redirectToCheckout(orgId, priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      enqueueSnackbar(error.message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    } finally {
      setLoading(false);
    }
  };

  if (orgError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading organization data: {orgError.message}
      </Alert>
    );
  }

  if (orgLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const org = orgDoc?.data();
  const isActive = org?.subscriptionStatus === 'active';
  const subscriptionEndDate = org?.subscriptionEnd?.toDate();

  return (
    <Box sx={{ p: 3, maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Billing & Subscription
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Plan
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
              }}>
                <Typography variant="body1" component="span">
                  {org?.planName || 'Free Tier'}
                </Typography>
                <Chip 
                  label={org?.subscriptionStatus || 'inactive'} 
                  color={isActive ? 'success' : 'default'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {subscriptionEndDate && (
                <Typography variant="body2" color="text.secondary">
                  {isActive ? 'Renews' : 'Expires'} on: {subscriptionEndDate.toLocaleDateString()}
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleUpgrade('price_premium')}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ minWidth: 180 }}
                >
                  {loading ? 'Processing...' : 'Upgrade Plan'}
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleUpgrade('price_enterprise')}
                  disabled={loading}
                  sx={{ minWidth: 180 }}
                >
                  Contact Sales
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3 }}>
            <BillingHistory orgId={orgId} />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <PaymentMethods orgId={orgId} />
        </Grid>
      </Grid>
    </Box>
  );
}

Billing.propTypes = {
  orgId: PropTypes.string.isRequired
};
