import Link from 'next/link'
import { Sparkles, XIcon, PlaySquare, GitBranch } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-dark-800/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ff2d8d, #7c3aed)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">ThumbAI</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              AI-powered YouTube thumbnail generation that helps creators grow faster. 
              No design skills needed — just paste your URL and create.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: XIcon,      href: '#', label: 'Twitter/X' },
                { Icon: PlaySquare, href: '#', label: 'YouTube' },
                { Icon: GitBranch,  href: '#', label: 'GitHub' },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center
                             text-white/40 hover:text-brand-400 hover:border-brand-400/30 transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/pricing',   label: 'Pricing' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms',   label: 'Terms of Service' },
                { href: '/dmca',    label: 'DMCA Policy' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            © {currentYear} ThumbAI. All rights reserved. Billing powered by Stripe.
          </p>
          <p className="text-xs text-white/25">
            User data is non-persistent. Thumbnails are generated transiently.
          </p>
        </div>
      </div>
    </footer>
  )
}
