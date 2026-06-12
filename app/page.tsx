import Link from 'next/link'
import { Sparkles, Zap, Image, Download, Shield, Star, ArrowRight, Check, PlaySquare, Layers, Type } from 'lucide-react'
import { AdPlaceholder } from '@/components/ui/AdPlaceholder'

export default function HomePage() {
  const features = [
    { icon: PlaySquare, title: 'Paste Any YouTube URL',      desc: 'We extract the video context and build a perfect thumbnail prompt automatically.' },
    { icon: Sparkles, title: 'AI-Powered Generation',      desc: 'Fal.ai Flux model creates viral, high-contrast thumbnails tuned for maximum CTR.' },
    { icon: Layers,   title: 'Canvas Editor',              desc: 'Drag text overlays, upload your photo with background removal, and layer everything.' },
    { icon: Download, title: '1280×720 Lossless Export',   desc: 'Download a pixel-perfect PNG ready to upload directly to YouTube Studio.' },
    { icon: Shield,   title: 'Secure & Private',           desc: 'Row-level security on all data. Billing handled end-to-end by Stripe.' },
    { icon: Type,     title: 'Dynamic Text Overlays',      desc: 'Impact fonts, thick outlines, color gradients — all draggable in real time.' },
  ]

  const testimonials = [
    { name: 'Priya S.',  handle: '@priya_creates',   text: 'ThumbAI doubled my CTR in the first week. The AI just *gets* what works on YouTube.',    avatar: 'P' },
    { name: 'Rahul M.',  handle: '@rahul_tech',      text: 'I went from 2% to 6% click-through rate after switching to ThumbAI thumbnails.',         avatar: 'R' },
    { name: 'Anjali K.', handle: '@anjali_vlogs',    text: 'The background removal on Elite is insane. My face cutouts look completely professional.', avatar: 'A' },
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Hero glow orbs */}
      <div className="glow-orb w-[600px] h-[600px] top-[-200px] left-[-200px]"
        style={{ background: 'radial-gradient(circle, rgba(255,45,141,0.2) 0%, transparent 70%)' }} />
      <div className="glow-orb w-[500px] h-[500px] top-[-100px] right-[-150px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered · 1280×720 PNG · Instant Download
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 text-balance animate-slide-up">
          Create Viral{' '}
          <span className="gradient-text">YouTube Thumbnails</span>
          {' '}with AI
        </h1>

        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 text-balance">
          Paste a YouTube URL, watch AI generate a stunning thumbnail in seconds.
          Drag text, upload your photo, export in 1280×720.{' '}
          <strong className="text-white/80">No design skills needed.</strong>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/auth/signup" id="hero-cta-primary" className="btn-primary text-base px-8 py-4">
            <Sparkles className="w-5 h-5" />
            Start Creating Free — 2 Thumbnails/Month
          </Link>
          <Link href="/pricing" id="hero-cta-pricing" className="btn-secondary text-base px-8 py-4">
            View Pricing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Hero visual — mock thumbnail preview */}
        <div className="relative mx-auto max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-float"
          style={{ boxShadow: '0 0 80px rgba(255,45,141,0.2)' }}>
          <div className="aspect-video bg-gradient-to-br from-dark-700 to-dark-600 relative flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1e1e35 0%, #16162a 50%, #0f0f1e 100%)' }}>
            {/* Mock thumbnail elements */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-1/2 h-full bg-gradient-to-r from-brand-600/20 to-transparent" />
              <div className="w-1/2 h-full bg-gradient-to-l from-accent-purple/20 to-transparent" />
            </div>
            <div className="relative z-10 text-center px-8">
              <div className="text-6xl font-display font-black mb-2"
                style={{ textShadow: '0 0 40px rgba(255,45,141,0.8), 4px 4px 0 rgba(0,0,0,0.8)' }}>
                <span className="gradient-text">VIRAL</span>
              </div>
              <div className="text-2xl font-bold text-white"
                style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.9)' }}>
                THUMBNAIL PREVIEW
              </div>
              <div className="mt-4 text-white/40 text-sm">Generated by ThumbAI ✦ AI-Powered</div>
            </div>
            {/* Corner badge */}
            <div className="absolute top-4 right-4 badge badge-pro text-xs">
              <Sparkles className="w-3 h-3" /> AI Generated
            </div>
          </div>
        </div>
      </section>

      {/* ── ADSENSE SLOT (top) ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <AdPlaceholder size="banner" />
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Go Viral</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Professional thumbnail tools powered by cutting-edge AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(255,45,141,0.2), rgba(124,58,237,0.2))' }}>
                  <f.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-center mb-12">
            Creators{' '}
            <span className="gradient-text">Love ThumbAI</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #ff2d8d, #7c3aed)' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center glass-card p-12"
          style={{ background: 'linear-gradient(135deg, rgba(255,45,141,0.1), rgba(124,58,237,0.1))' }}>
          <h2 className="font-display text-4xl font-bold mb-4">
            Ready to Go{' '}
            <span className="gradient-text">Viral?</span>
          </h2>
          <p className="text-white/60 mb-8">
            Start with 2 free thumbnails. No credit card required.
          </p>
          <Link href="/auth/signup" id="bottom-cta-btn" className="btn-primary text-base px-10 py-4">
            <Sparkles className="w-5 h-5" />
            Create Your First Thumbnail Free
          </Link>
        </div>
      </section>
    </div>
  )
}
