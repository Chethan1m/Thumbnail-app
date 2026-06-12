'use client'

import { Zap, Crown, Infinity } from 'lucide-react'
import type { Tier } from '@/types/database'

interface CreditBadgeProps {
  credits: number
  tier: Tier
  className?: string
}

const TIER_CONFIG: Record<Tier, { label: string; icon: typeof Zap; color: string; bg: string }> = {
  free:  { label: 'Free',  icon: Zap,      color: 'text-white/60',  bg: 'bg-white/5  border-white/10' },
  pro:   { label: 'Pro',   icon: Zap,      color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
  elite: { label: 'Elite', icon: Crown,    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
}

export function CreditBadge({ credits, tier, className = '' }: CreditBadgeProps) {
  const { label, icon: Icon, color, bg } = TIER_CONFIG[tier]
  const isUnlimited = credits >= 999999

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${bg} ${color} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="capitalize">{label}</span>
      <span className="text-white/30">·</span>
      {isUnlimited ? (
        <span className="flex items-center gap-0.5">
          <Infinity className="w-3.5 h-3.5" /> credits
        </span>
      ) : (
        <span>{credits} credit{credits !== 1 ? 's' : ''}</span>
      )}
    </div>
  )
}
