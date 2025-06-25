// src/pages/Billing.js
const Billing = ({ orgId }) => {
  const { data: org } = useDocument(doc(db, `organizations/${orgId}`));

  return (
    <Card>
      <Typography variant="h6">Current Plan: {org?.subscriptionStatus}</Typography>
      <Button onClick={() => redirectToCheckout(orgId, "price_123")}>
        Upgrade Plan
      </Button>
    </Card>
  );
};