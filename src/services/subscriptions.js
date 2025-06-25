// src/services/subscriptions.js
import { loadStripe } from '@stripe/stripe-js';

export const redirectToCheckout = async (orgId, priceId) => {
  const stripe = await loadStripe(process.env.REACT_APP_STRIPE_KEY);
  await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    successUrl: `${window.location.origin}/org/${orgId}/success`,
    cancelUrl: `${window.location.origin}/org/${orgId}/pricing`,
    metadata: { orgId }
  });
};