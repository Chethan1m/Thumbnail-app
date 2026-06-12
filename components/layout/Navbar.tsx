'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Sparkles, Menu, X, Zap, LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, loading, signOut } = useSupabase()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navLinks = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/background-removal', label: 'Background Removal' },
    { href: '/dashboard', label: 'Dashboard', auth: true },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff2d8d, #7c3aed)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight gradient-text">
              ThumbAI
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks
              .filter(l => !l.auth || user)
              .map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === l.href
                      ? 'text-brand-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
          </div>

          {/* Auth actions */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-8 rounded-lg shimmer" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="btn-secondary py-2 px-4 text-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  id="nav-signout-btn"
                  onClick={handleSignOut}
                  className="btn-secondary py-2 px-4 text-sm text-white/60"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="btn-secondary py-2 px-4 text-sm">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary py-2 px-4 text-sm">
                  <Zap className="w-4 h-4" />
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            id="nav-mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-dark-800/95 backdrop-blur-xl animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.filter(l => !l.auth || user).map(l => (
              <Link key={l.href} href={l.href}
                className="text-white/70 hover:text-white py-2 text-sm font-medium"
                onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
              {user ? (
                <button onClick={handleSignOut} className="btn-secondary w-full text-sm justify-center">
                  Sign Out
                </button>
              ) : (
                <>
                  <Link href="/auth/login"  onClick={() => setOpen(false)} className="btn-secondary w-full text-sm justify-center">Sign In</Link>
                  <Link href="/auth/signup" onClick={() => setOpen(false)} className="btn-primary  w-full text-sm justify-center">Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
