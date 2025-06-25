import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/firebase';

export default function BillingPortalButton({ orgId }) {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const createPortalLink = httpsCallable(functions, 'createStripePortalLink');
      const { data } = await createPortalLink({ 
        orgId,
        returnUrl: window.location.href
      });
      window.location.href = data.url;
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="contained" 
      onClick={handleManageSubscription}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
    >
      Manage Billing & Subscription
    </Button>
  );
}
