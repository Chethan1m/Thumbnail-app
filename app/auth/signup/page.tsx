'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState('')

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) { setError(error.message); setLoading(false); return }
    
    if (data.session) {
      // If email confirmation is off, it auto-logs in
      window.location.href = redirect
    } else {
      // Fallback if they didn't actually disable it in the Supabase Dashboard
      setDone(true)
      setLoading(false)
    }
  }

  const perks = [
    '2 free AI thumbnail generations/month',
    'HTML5 canvas editor with drag-and-drop text',
    'YouTube URL auto-extraction',
    'No credit card required',
  ]

  return (
    <>
      {/* Free plan perks */}
      <div className="glass-card p-4 mb-5">
        <p className="text-xs text-white/40 mb-3 uppercase tracking-wider font-medium">Free plan includes:</p>
        <ul className="space-y-2">
          {perks.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-white/70">
              <Check className="w-4 h-4 text-brand-400 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card p-8">
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-white/60 text-sm mb-6">
              We've sent a verification link to your email address. Please click the link to activate your account and start designing.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs text-white/40">
              <span className="font-semibold text-white/60 block mb-1">💡 Admin Setup Note:</span>
              To skip email confirmation and allow instant signups, go to your <strong>Supabase Dashboard &rarr; Auth Settings &rarr; Providers &rarr; Email</strong> and turn <strong>Confirm email</strong> to OFF.
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-5 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-firstname">First Name</label>
                  <input
                    id="signup-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-lastname">Last Name</label>
                  <input
                    id="signup-lastname"
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-email">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-password">
                  Password <span className="text-white/30">(min 8 chars)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="signup-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5" htmlFor="signup-confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="signup-confirm-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                id="signup-submit-btn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Create Free Account
              </button>
            </form>

            <p className="text-xs text-white/30 text-center mt-4">
              By signing up you agree to our{' '}
              <Link href="/terms" className="text-white/50 hover:text-white">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-white/50 hover:text-white">Privacy Policy</Link>.
            </p>
          </>
        )}
      </div>
    </>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 relative">
      <div className="glow-orb w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(circle, rgba(255,45,141,0.12) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff2d8d, #7c3aed)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl gradient-text">ThumbAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Create your free account</h1>
          <p className="text-white/50 text-sm">Start making viral thumbnails today</p>
        </div>

        <Suspense fallback={<div className="text-center text-white/50"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}>
          <SignupForm />
        </Suspense>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
