import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent, getSubscription } from '@/lib/stripe';
import { getSupabase } from '@/lib/supabase';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    ({ event } = await handleWebhookEvent(payload, signature));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getSupabase();

  // Always return 200 to Stripe — even on handler errors — to prevent infinite retries.
  // Errors are logged but don't block acknowledgment.
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userEmail = session.metadata?.userEmail;
        if (userEmail && session.subscription) {
          const subId = session.subscription as string;

          // Fetch period end — but don't fail the entire activation if this call errors
          let periodEnd: string | null = null;
          try {
            const sub = await getSubscription(subId);
            periodEnd = sub.currentPeriodEnd.toISOString();
          } catch (err) {
            console.error('[stripe-webhook] getSubscription failed for', subId, err instanceof Error ? err.message : err);
          }

          const updates: Record<string, unknown> = {
            plan: 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subId,
            stripe_status: 'active',
            cancel_at_period_end: false,
          };
          if (periodEnd) {
            updates.current_period_end = periodEnd;
          }

          await supabase
            .from('user_settings')
            .update(updates)
            .eq('user_email', userEmail);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const email = sub.metadata?.userEmail;
        const isActive = sub.status === 'active' || sub.status === 'trialing';

        const updates: Record<string, unknown> = {
          stripe_status: sub.status,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: new Date(sub.items.data[0]?.current_period_end
            ? sub.items.data[0].current_period_end * 1000
            : Date.now(),
          ).toISOString(),
        };

        // Sync plan based on subscription status
        if (isActive) {
          updates.plan = 'pro';
        }

        // Revoke access for terminal statuses (unpaid after all retries, incomplete_expired)
        const terminalStatuses = ['unpaid', 'incomplete_expired'];
        if (terminalStatuses.includes(sub.status)) {
          updates.plan = 'free';
        }

        if (email) {
          await supabase.from('user_settings').update(updates).eq('user_email', email);
        } else {
          const customerId = sub.customer as string;
          await supabase.from('user_settings').update(updates).eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const email = sub.metadata?.userEmail;
        const updates = {
          plan: 'free',
          stripe_status: 'canceled',
          cancel_at_period_end: false,
          stripe_subscription_id: null as string | null,
          current_period_end: null as string | null,
        };

        if (email) {
          await supabase.from('user_settings').update(updates).eq('user_email', email);
        } else {
          const customerId = sub.customer as string;
          await supabase.from('user_settings').update(updates).eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Only mark past_due for renewal failures — not initial checkout failures
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const renewalReasons = ['subscription_cycle', 'subscription_update'];
        if (customerId && renewalReasons.includes(invoice.billing_reason ?? '')) {
          await supabase
            .from('user_settings')
            .update({ stripe_status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Handles successful retry after past_due — restore pro access
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const renewalReasons = ['subscription_cycle', 'subscription_update'];
        if (customerId && renewalReasons.includes(invoice.billing_reason ?? '')) {
          await supabase
            .from('user_settings')
            .update({ plan: 'pro', stripe_status: 'active' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
    }
  } catch (error) {
    // Log error but still return 200 to prevent Stripe retry storm
    console.error('[stripe-webhook]', event.type, event.id, error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ received: true });
}
