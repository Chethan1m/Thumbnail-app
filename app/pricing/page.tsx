'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { AdPlaceholder } from '@/components/ui/AdPlaceholder'
import type { Metadata } from 'next'

const plans = [
  {
    id:       'free',
    name:     'Free',
    price:    '₹0',
    period:   '/month',
    tagline:  'Perfect to get started',
    icon:     Zap,
    priceId:  null,
    credits:  2,
    color:    'border-white/10',
    badge:    null,
    cta:      'Start Free',
    features: [
      '2 AI thumbnail generations/month',
      'Standard resolution export',
      'Basic text overlays',
      'YouTube URL extraction',
      'Ad-supported experience',
    ],
    missing: [
      'High-resolution 1280×720 PNG',
      'Custom photo upload',
      'Background removal',
      'Priority generation',
    ],
  },
  {
    id:       'pro',
    name:     'Pro',
    price:    '₹1,500',
    period:   '/month',
    tagline:  'For serious creators',
    icon:     Sparkles,
    priceId:  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    credits:  100,
    color:    'border-brand-500/40',
    badge:    'Most Popular',
    popular:  true,
    cta:      'Upgrade to Pro',
    features: [
      '100 AI thumbnail generations/month',
      'High-res 1280×720 PNG export',
      'Custom photo upload',
      'All text overlay styles',
      'Draggable canvas editor',
      'No ads',
      'Priority AI queue',
    ],
    missing: [
      'Background removal (AI)',
      'Unlimited generations',
    ],
  },
  {
    id:       'elite',
    name:     'Elite',
    price:    '₹3,999',
    period:   '/month',
    tagline:  'For power users & agencies',
    icon:     Crown,
    priceId:  process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID,
    credits:  999999,
    color:    'border-amber-500/40',
    badge:    'Best Value',
    cta:      'Go Elite',
    features: [
      'Unlimited AI thumbnail generations',
      'High-res 1280×720 PNG export',
      'AI Background Removal (BiRefNet)',
      'Custom photo upload & overlay',
      'All canvas editor features',
      'No ads ever',
      'Fastest AI queue priority',
      'Email support',
    ],
    missing: [],
  },
]

export default function PricingPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (!plan.priceId) return

    if (!user) {
      router.push('/auth/signup?redirect=/pricing')
      return
    }

    setLoadingPlan(plan.id)
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId: plan.priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Something went wrong')
      }
    } catch (err) {
      console.error(err)
      alert('Could not start checkout. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="relative min-h-screen py-20 px-4">
      {/* Background glow */}
      <div className="glow-orb w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2"
        style={{ background: 'radial-gradient(circle, rgba(255,45,141,0.1) 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Pricing in INR
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Choose Your{' '}
            <span className="gradient-text">Creative Plan</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Start free. Upgrade when your channel needs more.
            Cancel anytime — no lock-in, no hidden fees.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map(plan => {
            const isPopular = plan.popular
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${plan.color} ${
                  isPopular
                    ? 'bg-gradient-to-b from-brand-500/10 to-dark-700/50 shadow-glow-brand scale-105'
                    : 'glass-card'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                      isPopular
                        ? 'bg-gradient-brand text-white'
                        : 'bg-amber-500 text-black'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                    isPopular ? 'bg-brand-500/20' : 'bg-white/5'
                  }`}>
                    <plan.icon className={`w-5 h-5 ${isPopular ? 'text-brand-400' : 'text-white/60'}`} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                  <p className="text-sm text-white/40">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-display font-black ${isPopular ? 'gradient-text' : 'text-white'}`}>
                      {plan.price}
                    </span>
                    <span className="text-white/40 text-sm mb-1">{plan.period}</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    {plan.credits >= 999999 ? 'Unlimited' : `${plan.credits}`} generations/month
                  </p>
                </div>

                {/* CTA */}
                <button
                  id={`pricing-cta-${plan.id}`}
                  onClick={() => plan.priceId ? handleUpgrade(plan) : router.push(user ? '/dashboard' : '/auth/signup')}
                  disabled={loadingPlan === plan.id}
                  className={`w-full mb-8 py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    isPopular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <span className="animate-spin">⋯</span>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.missing?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/20 line-through">
                      <Check className="w-4 h-4 text-white/10 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* AdSense slot — free tier users */}
        <AdPlaceholder size="leaderboard" className="mb-10" />

        {/* FAQ / Trust */}
        <div className="glass-card p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-3">All plans include</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/50">
            {[
              '🔒 256-bit SSL encryption',
              '💳 Stripe-secured billing',
              '🚫 No hidden fees',
              '📧 Transactional emails via Resend',
              '🔁 Cancel anytime',
            ].map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
