import { loadStripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';

let stripePromise;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const redirectToCheckout = async (orgId, priceId) => {
  try {
    const stripe = await getStripe();
    const createCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');

    const { data } = await createCheckoutSession({
      orgId,
      priceId,
      successUrl: `${window.location.origin}/organization/${orgId}/billing/success`,
      cancelUrl: `${window.location.origin}/organization/${orgId}/billing`,
      mode: 'subscription'
    });

    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

export const redirectToCustomerPortal = async (orgId) => {
  try {
    const stripe = await getStripe();
    const createPortalSession = httpsCallable(functions, 'createStripePortalLink');

    const { data } = await createPortalSession({
      orgId,
      returnUrl: `${window.location.origin}/organization/${orgId}/billing`
    });

    window.location.href = data.url;
  } catch (error) {
    console.error('Stripe portal error:', error);
    throw error;
  }
};
