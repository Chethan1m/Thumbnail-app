'use client'

interface AdPlaceholderProps {
  size: 'banner' | 'rectangle' | 'leaderboard'
  className?: string
}

const AD_SIZES: Record<AdPlaceholderProps['size'], { label: string; minHeight: string }> = {
  banner:      { label: 'Sponsored Space (728×90)',   minHeight: '90px' },
  rectangle:   { label: 'Sponsored Space (300×250)',  minHeight: '250px' },
  leaderboard: { label: 'Sponsored Space (970×90)',   minHeight: '90px' },
}

export function AdPlaceholder({ size, className = '' }: AdPlaceholderProps) {
  const { label, minHeight } = AD_SIZES[size]

  return (
    <div
      className={`w-full flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] ${className}`}
      style={{ minHeight }}
      role="complementary"
      aria-label="Advertisement placement"
    >
      <span className="text-xs text-white/20 font-medium tracking-widest uppercase">
        {label}
      </span>
    </div>
  )
}
