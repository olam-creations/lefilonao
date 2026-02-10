import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  stripeInstance = new Stripe(key, { apiVersion: '2026-01-28.clover' });
  return stripeInstance;
}

const PRICE_PRO = () => {
  const id = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!id) throw new Error('STRIPE_PRICE_PRO_MONTHLY not configured');
  return id;
};

/** Stripe Tax — flip to 'true' when exceeding micro-enterprise VAT threshold */
const isTaxEnabled = () => process.env.STRIPE_TAX_ENABLED === 'true';

interface CheckoutParams {
  email: string;
  returnUrl: string;
  customerId?: string;
}

export async function createCheckoutSession(params: CheckoutParams): Promise<{ clientSecret: string }> {
  const stripe = getStripe();
  const founderCoupon = process.env.STRIPE_COUPON_FOUNDER;

  // Expire checkout session after 30 minutes (default is 24h)
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

  const taxEnabled = isTaxEnabled();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    ui_mode: 'embedded',
    line_items: [{ price: PRICE_PRO(), quantity: 1 }],
    metadata: { userEmail: params.email, plan: 'pro' },
    subscription_data: {
      metadata: { userEmail: params.email, plan: 'pro' },
    },
    return_url: params.returnUrl,
    expires_at: expiresAt,
  };

  // When Stripe Tax is disabled, restrict to card. When enabled, let Stripe
  // determine valid payment methods based on customer location.
  if (!taxEnabled) {
    sessionParams.payment_method_types = ['card'];
  }

  // Stripe Tax: automatic VAT calculation + customer tax ID collection (intra-EU)
  if (taxEnabled) {
    sessionParams.automatic_tax = { enabled: true };
    sessionParams.tax_id_collection = { enabled: true };
  }

  // Reuse existing Stripe customer to avoid duplicates (re-subscription, etc.)
  if (params.customerId) {
    sessionParams.customer = params.customerId;
    sessionParams.customer_update = { address: 'auto', ...(taxEnabled && { name: 'auto' }) };
  } else {
    sessionParams.customer_email = params.email;
  }

  // Require billing address for tax calculation when no existing customer
  if (taxEnabled && !params.customerId) {
    sessionParams.billing_address_collection = 'required';
  }

  if (founderCoupon) {
    sessionParams.discounts = [{ coupon: founderCoupon }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  if (!session.client_secret) {
    throw new Error('Stripe did not return a client_secret');
  }
  return { clientSecret: session.client_secret };
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

export async function handleWebhookEvent(
  payload: string,
  signature: string,
): Promise<{ event: Stripe.Event }> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  const event = stripe.webhooks.constructEvent(payload, signature, secret);
  return { event };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

export async function resumeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
}

/** Whether Stripe Tax is active — for server-side checks */
export const taxEnabled = isTaxEnabled;

export async function getSubscription(subscriptionId: string): Promise<{
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = sub.items.data[0]?.current_period_end;
  return {
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
}
