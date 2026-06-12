import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'development') {
  console.warn('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
})

export const STRIPE_PRICES = {
  pro:   process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID   ?? '',
  elite: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID ?? '',
} as const
