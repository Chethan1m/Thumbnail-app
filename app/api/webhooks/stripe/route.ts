import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getTierFromPriceId, TIER_CREDITS } from '@/types/database'

export const dynamic = 'force-dynamic'

// Helper: safely read subscription fields regardless of Stripe SDK version
function getSubFields(sub: any) {
  return {
    priceId:   sub.items?.data?.[0]?.price?.id ?? '',
    periodEnd: sub.current_period_end
      ? new Date((sub.current_period_end as number) * 1000).toISOString()
      : new Date().toISOString(),
    status:   sub.status ?? 'active',
    customer: typeof sub.customer === 'string' ? sub.customer : (sub.customer?.id ?? ''),
    id:       sub.id ?? '',
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  const { stripe } = await import('@/lib/stripe')
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[WEBHOOK SIGNATURE ERROR]', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use admin client cast to any to bypass strict Supabase generic type constraints
  // (safe because service role key is server-side only and not exposed to client)
  const db = createAdminClient() as any

  try {
    switch (event.type) {

      // ── New subscription or one-time checkout completed ──────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId         = session.client_reference_id ?? session.metadata?.userId
        const customerId     = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId) { console.error('No userId in session'); break }

        const rawSub = await stripe.subscriptions.retrieve(subscriptionId)
        const { priceId, periodEnd, status } = getSubFields(rawSub)
        const tier    = getTierFromPriceId(priceId)
        const credits = TIER_CREDITS[tier]

        await db.from('subscriptions').upsert({
          id:                  subscriptionId,
          user_id:             userId,
          stripe_customer_id:  customerId,
          stripe_price_id:     priceId,
          status,
          current_period_end:  periodEnd,
          updated_at:          new Date().toISOString(),
        })

        await db.from('user_credits').upsert({
          user_id:           userId,
          credits_remaining: credits,
          tier,
          credits_reset_at:  periodEnd,
          updated_at:        new Date().toISOString(),
        })

        console.log(`[WEBHOOK] Provisioned ${credits} credits (${tier}) for user ${userId}`)
        break
      }

      // ── Monthly renewal ──────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as any
        if (!invoice.subscription) break

        const rawSub = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const { priceId, periodEnd, status, customer, id: subId } = getSubFields(rawSub)
        const tier    = getTierFromPriceId(priceId)
        const credits = TIER_CREDITS[tier]

        const { data: existingSub } = await db
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customer)
          .single()

        const userId = existingSub?.user_id
        if (!userId) { console.error('No subscription found for customer', customer); break }

        await db.from('user_credits').update({
          credits_remaining: credits,
          credits_reset_at:  periodEnd,
          updated_at:        new Date().toISOString(),
        }).eq('user_id', userId)

        await db.from('subscriptions').update({
          status,
          current_period_end: periodEnd,
          updated_at:         new Date().toISOString(),
        }).eq('id', subId)

        console.log(`[WEBHOOK] Renewed ${credits} credits (${tier}) for user ${userId}`)
        break
      }

      // ── Subscription canceled ────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as any
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

        const { data: existingSub } = await db
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        const userId = existingSub?.user_id
        if (!userId) break

        await db.from('user_credits').update({
          credits_remaining: TIER_CREDITS.free,
          tier:              'free',
          updated_at:        new Date().toISOString(),
        }).eq('user_id', userId)

        await db.from('subscriptions').update({
          status:    'canceled',
          updated_at: new Date().toISOString(),
        }).eq('id', sub.id)

        console.log(`[WEBHOOK] Subscription canceled, reset to free for user ${userId}`)
        break
      }

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('[WEBHOOK HANDLER ERROR]', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
