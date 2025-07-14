import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/firebase';
import PropTypes from 'prop-types';

export default function BillingPortalButton({ orgId }) {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleManageSubscription = async () => {
    if (!orgId) {
      enqueueSnackbar('Organization ID is missing', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
      const { data } = await createPortalLink({ 
        orgId,
        returnUrl: `${window.location.origin}/organization/${orgId}/billing`
      });
      
      window.location.assign(data.url);
    } catch (error) {
      console.error('Billing portal error:', error);
      enqueueSnackbar(error.message || 'Failed to access billing portal', { 
        variant: 'error',
        autoHideDuration: 5000 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Manage your subscription and payment methods">
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleManageSubscription}
        disabled={loading || !orgId}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{ minWidth: 220 }}
      >
        {loading ? 'Loading...' : 'Manage Billing'}
      </Button>
    </Tooltip>
  );
}

BillingPortalButton.propTypes = {
  orgId: PropTypes.string.isRequired
};
