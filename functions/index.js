const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.firestore();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Creates a user document and a new organization when a user signs up.
 * Assigns a Stripe Customer ID and sets the initial "free" plan.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info(`New user created: ${user.uid}`, { uid: user.uid });

  const stripeCustomer = await stripe.customers.create({
    email: user.email,
    name: user.displayName,
    metadata: { firebaseUID: user.uid },
  });

  const orgRef = db.collection("organizations").doc();
  const userRef = db.collection("users").doc(user.uid);

  const batch = db.batch();

  // Create organization for the new user
  batch.set(orgRef, {
    name: `${user.displayName || user.email.split("@")[0]}'s Organization`,
    ownerId: user.uid,
    members: [user.uid],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    stripeCustomerId: stripeCustomer.id,
    subscription: {
      plan: "free",
      status: "active",
    },
  });

  // Create user profile
  batch.set(userRef, {
    email: user.email,
    displayName: user.displayName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    organizations: {
      [orgRef.id]: "admin", // User is admin of their own new org
    },
  });

  // Set custom claims
  await admin.auth().setCustomUserClaims(user.uid, {
    roles: { [orgRef.id]: "admin" },
  });

  return batch.commit();
});

/**
 * Creates a Stripe Checkout Session for a subscription.
 */
exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const { orgId, priceId, successUrl, cancelUrl } = data;
  const orgDoc = await db.collection("organizations").doc(orgId).get();

  if (!orgDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Organization not found.");
  }

  const customerId = orgDoc.data().stripeCustomerId;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId },
    });

    return { url: session.url };
  } catch (error) {
    logger.error("Stripe checkout session creation failed", { orgId, error: error.message });
    throw new functions.https.HttpsError("internal", "Could not create Stripe session.");
  }
});

/**
 * Creates a Stripe Customer Portal session to manage billing.
 */
exports.createStripePortalLink = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { orgId, returnUrl } = data;
    const orgDoc = await db.collection("organizations").doc(orgId).get();

    if (!orgDoc.exists || !orgDoc.data().stripeCustomerId) {
        throw new functions.https.HttpsError("failed-precondition", "No subscription found for this organization.");
    }

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: orgDoc.data().stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: portalSession.url };
    } catch (error) {
        logger.error("Stripe portal link creation failed", { orgId, error: error.message });
        throw new functions.https.HttpsError("internal", "Could not create billing portal session.");
    }
});


/**
 * Handles incoming webhooks from Stripe to update subscription status.
 */
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Webhook signature verification failed.", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;
  logger.info(`Received Stripe webhook: ${event.type}`, data);
  
  const handler = webhookHandlers[event.type];
  if (handler) {
    try {
      await handler(data);
      res.json({ received: true });
    } catch (err) {
      logger.error(`Webhook handler for ${event.type} failed.`, { error: err.message });
      res.status(500).json({ error: "Internal server error." });
    }
  } else {
    logger.warn(`No handler for webhook event: ${event.type}`);
    res.json({ received: true });
  }
});

const webhookHandlers = {
  'checkout.session.completed': async (session) => {
    const orgId = session.metadata.orgId;
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    return updateSubscriptionStatus(orgId, subscription);
  },
  'customer.subscription.updated': async (subscription) => {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const orgId = customer.metadata.orgId;
    return updateSubscriptionStatus(orgId, subscription);
  },
  'customer.subscription.deleted': async (subscription) => {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const orgId = customer.metadata.orgId;
    return updateSubscriptionStatus(orgId, subscription);
  }
};

const getPlanFromPriceId = (priceId) => {
    const plans = {
      [process.env.VITE_STRIPE_BASIC_PRICE_ID]: 'basic',
      [process.env.VITE_STRIPE_PRO_PRICE_ID]: 'professional',
      [process.env.VITE_STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
    };
    return plans[priceId] || 'free';
};

const updateSubscriptionStatus = (orgId, subscription) => {
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);

  const subData = {
    plan: plan,
    status: subscription.status,
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  return db.collection('organizations').doc(orgId).set({ subscription: subData }, { merge: true });
};
