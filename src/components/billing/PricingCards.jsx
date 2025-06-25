import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, List, ListItem, ListItemIcon, CircularProgress, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSnackbar } from 'notistack';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/firebase';

const PLANS = [
  {
    name: 'Basic',
    price: '$50/month',
    features: ['Unlimited assessments', 'Forms', 'PDF Reports'],
    stripePriceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID
  },
  {
    name: 'Professional',
    price: '$100/month',
    features: ['All features in Basic', 'AI Scoring', 'Offline Sync'],
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID
  },
  {
    name: 'Enterprise',
    price: '$200/month',
    features: ['All features in Professional', 'White-labeling', 'Mobile apps'],
    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID
  }
];

export default function PricingCards({ orgId, currentPlan }) {
  const { enqueueSnackbar } = useSnackbar();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSubscribe = async (planName, priceId) => {
    setLoadingPlan(planName);
    try {
      const createCheckout = httpsCallable(functions, 'createStripeCheckoutSession');
      const { data } = await createCheckout({ 
        orgId,
        priceId,
        successUrl: `${window.location.origin}/organization/${orgId}/billing?success=true`,
        cancelUrl: window.location.href
      });
      window.location.href = data.url;
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
      setLoadingPlan(null);
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
      {PLANS.map(plan => (
        <Card key={plan.name} variant="outlined" sx={{ 
          borderColor: currentPlan === plan.name.toLowerCase() ? 'primary.main' : 'divider',
          borderWidth: 2,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom>{plan.name}</Typography>
            <Typography variant="h4" gutterBottom>{plan.price}</Typography>
            <List>
              {plan.features.map(feature => (
                <ListItem key={feature} disablePadding>
                  <ListItemIcon sx={{ minWidth: 40 }}><CheckCircleIcon color="success" /></ListItemIcon>
                  <Typography variant="body1">{feature}</Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant={currentPlan === plan.name.toLowerCase() ? 'contained' : 'outlined'}
              disabled={currentPlan === plan.name.toLowerCase() || !!loadingPlan}
              onClick={() => handleSubscribe(plan.name, plan.stripePriceId)}
            >
              {loadingPlan === plan.name ? <CircularProgress size={24} /> : 
               currentPlan === plan.name.toLowerCase() ? 'Current Plan' : 'Subscribe'}
            </Button>
          </Box>
        </Card>
      ))}
    </Box>
  );
}
