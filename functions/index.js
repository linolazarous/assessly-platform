const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("firebase-functions/logger");
const { HttpsError } = require("firebase-functions/v2/https");

// Initialize Firebase Admin with explicit configuration
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Security rule: Ensure orgId matches user's organization
const validateOrganizationAccess = async (orgId, userId) => {
  if (!orgId || !userId) {
    throw new HttpsError("permission-denied", "Organization ID and User ID are required");
  }

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists || !userDoc.data().organizations?.[orgId]) {
    throw new HttpsError("permission-denied", "User does not have access to this organization");
  }
};

/**
 * Creates user document and organization on signup
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    logger.info(`New user created: ${user.uid}`, { 
      email: user.email, 
      provider: user.providerData[0]?.providerId 
    });

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.displayName || user.email.split("@")[0],
      metadata: { firebaseUID: user.uid }
    });

    // Create Firestore batch
    const batch = db.batch();
    const orgRef = db.collection("organizations").doc();
    const userRef = db.collection("users").doc(user.uid);

    // Organization data
    batch.set(orgRef, {
      name: `${user.displayName || user.email.split("@")[0]}'s Organization`,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeCustomerId: stripeCustomer.id,
      subscription: {
        plan: "free",
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    // User profile data
    batch.set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      organizations: {
        [orgRef.id]: "admin"
      }
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      [`org_${orgRef.id}_role`]: "admin",
      orgs: { [orgRef.id]: true }
    });

    await batch.commit();
    logger.info(`Successfully created user and organization`, { uid: user.uid, orgId: orgRef.id });

  } catch (error) {
    logger.error("User creation failed", { 
      uid: user.uid, 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
});

/**
 * Creates Stripe Checkout Session
 */
exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { orgId, priceId, successUrl, cancelUrl } = data;
  
  // Validate input
  if (!orgId || !priceId || !successUrl || !cancelUrl) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }

  try {
    await validateOrganizationAccess(orgId, context.auth.uid);

    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists || !orgDoc.data().stripeCustomerId) {
      throw new HttpsError("failed-precondition", "Organization not properly configured");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: orgDoc.data().stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { 
        orgId,
        userId: context.auth.uid 
      },
      subscription_data: {
        metadata: { orgId }
      }
    });

    // Log session creation
    await db.collection("billingLogs").doc(session.id).set({
      orgId,
      userId: context.auth.uid,
      sessionId: session.id,
      priceId,
      status: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { sessionId: session.id, url: session.url };

  } catch (error) {
    logger.error("Checkout session creation failed", { 
      orgId,
      userId: context.auth?.uid,
      error: error.message,
      stack: error.stack 
    });
    throw new HttpsError("internal", "Failed to create checkout session");
  }
});

/**
 * Creates Stripe Customer Portal session
 */
exports.createStripePortalLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { orgId, returnUrl } = data;
  
  try {
    await validateOrganizationAccess(orgId, context.auth.uid);

    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists || !orgDoc.data().stripeCustomerId) {
      throw new HttpsError("failed-precondition", "No subscription found");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: orgDoc.data().stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };

  } catch (error) {
    logger.error("Portal session creation failed", { 
      orgId,
      userId: context.auth?.uid,
      error: error.message,
      stack: error.stack 
    });
    throw new HttpsError("internal", "Failed to create portal session");
  }
});

/**
 * Handles Stripe webhooks
 */
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, 
      sig, 
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error("Webhook verification failed", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Processing Stripe event: ${event.type}`, { 
    eventId: event.id,
    type: event.type 
  });

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    logger.error("Webhook handler failed", { 
      eventId: event.id,
      error: err.message,
      stack: err.stack 
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

const handleStripeEvent = async (event) => {
  const data = event.data.object;
  
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(data);
      break;
      
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(data);
      break;
      
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(data);
      break;
      
    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(data);
      break;
      
    case "invoice.payment_failed":
      await handlePaymentFailed(data);
      break;
      
    default:
      logger.debug(`Unhandled event type: ${event.type}`);
  }
};

const handleCheckoutSessionCompleted = async (session) => {
  const orgId = session.metadata.orgId;
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await updateSubscriptionStatus(orgId, subscription);
  
  // Update billing log
  await db.collection("billingLogs").doc(session.id).update({
    status: "completed",
    subscriptionId: subscription.id,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const handleSubscriptionUpdated = async (subscription) => {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const orgId = customer.metadata.orgId;
  await updateSubscriptionStatus(orgId, subscription);
};

const handleSubscriptionDeleted = async (subscription) => {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const orgId = customer.metadata.orgId;
  await updateSubscriptionStatus(orgId, subscription);
};

const handlePaymentSucceeded = async (invoice) => {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const orgId = customer.metadata.orgId;
  
  await db.collection("billingInvoices").doc(invoice.id).set({
    orgId,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    invoicePdf: invoice.invoice_pdf,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    status: "paid",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const handlePaymentFailed = async (invoice) => {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const orgId = customer.metadata.orgId;
  
  await db.collection("billingInvoices").doc(invoice.id).set({
    orgId,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt 
      ? admin.firestore.Timestamp.fromMillis(invoice.next_payment_attempt * 1000)
      : null,
    status: "payment_failed",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const updateSubscriptionStatus = async (orgId, subscription) => {
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);
  
  const subData = {
    plan,
    status: subscription.status,
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_end * 1000
    ),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await db.collection("organizations").doc(orgId).update({ 
    subscription: subData 
  });
  
  logger.info(`Updated subscription for org ${orgId}`, { 
    plan, 
    status: subscription.status 
  });
};

const getPlanFromPriceId = (priceId) => {
  const plans = {
    [process.env.STRIPE_BASIC_PRICE_ID]: "basic",
    [process.env.STRIPE_PRO_PRICE_ID]: "professional",
    [process.env.STRIPE_ENTERPRISE_PRICE_ID]: "enterprise",
  };
  return plans[priceId] || "free";
};

// Scheduled function to check for expiring subscriptions
exports.checkExpiringSubscriptions = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("UTC")
  .onRun(async (context) => {
    const now = new Date();
    const threshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const orgsSnapshot = await db.collection("organizations")
      .where("subscription.currentPeriodEnd", "<=", admin.firestore.Timestamp.fromDate(threshold))
      .where("subscription.status", "==", "active")
      .get();
    
    for (const doc of orgsSnapshot.docs) {
      const org = doc.data();
      logger.info(`Sending renewal reminder to org ${doc.id}`);
      
      // In a real app, you would send an email here
      await db.collection("notifications").add({
        orgId: doc.id,
        type: "subscription_renewal_reminder",
        message: `Your subscription will renew on ${org.subscription.currentPeriodEnd.toDate().toLocaleDateString()}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });
    }
    
    logger.info(`Processed ${orgsSnapshot.size} expiring subscriptions`);
  });
