import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripe';
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userEmail = session.metadata?.userEmail;
        if (userEmail) {
          await supabase
            .from('user_settings')
            .update({
              plan: 'pro',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              stripe_status: 'active',
            })
            .eq('user_email', userEmail);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const email = sub.metadata?.userEmail;
        const updates = {
          stripe_status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: new Date(sub.items.data[0]?.current_period_end
            ? sub.items.data[0].current_period_end * 1000
            : Date.now(),
          ).toISOString(),
        };

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
        const updates = { plan: 'free', stripe_status: 'canceled' };

        if (email) {
          await supabase.from('user_settings').update(updates).eq('user_email', email);
        } else {
          const customerId = sub.customer as string;
          await supabase.from('user_settings').update(updates).eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (customerId) {
          await supabase
            .from('user_settings')
            .update({ stripe_status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
