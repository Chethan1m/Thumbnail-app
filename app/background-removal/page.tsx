'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { AdPlaceholder } from '@/components/ui/AdPlaceholder'
import { CreditBadge } from '@/components/ui/CreditBadge'
import {
  Sparkles, Upload, Loader2, Download, AlertCircle,
  CheckCircle, ArrowRight, ShieldCheck, Crown, Image as ImageIcon
} from 'lucide-react'
import type { Tier } from '@/types/database'

export default function BackgroundRemovalPage() {
  const { user, loading: authLoading } = useSupabase()
  
  // App state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [credits, setCredits] = useState<number | null>(null)
  const [tier, setTier] = useState<Tier>('free')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current user credits if logged in
  const loadCredits = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/user')
      if (res.ok) {
        const data = await res.json()
        setCredits(data.credits?.credits_remaining ?? 0)
        setTier(data.credits?.tier ?? 'free')
      }
    } catch {}
  }

  useEffect(() => {
    if (user) loadCredits()
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    resetState()
    setImageFile(file)
    setOriginalUrl(URL.createObjectURL(file))
  }

  const resetState = () => {
    setImageFile(null)
    setOriginalUrl(null)
    setResultUrl(null)
    setError('')
    setSuccess('')
  }

// Helper to compress and resize images on the client side before uploading to Vercel/Fal.ai
function compressImage(file: File, maxDimension = 1200, quality = 0.85): Promise<Blob | File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Downscale only if dimensions exceed maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        } else {
          resolve(file)
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              resolve(file)
            }
          },
          mimeType,
          quality
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

  const handleRemoveBackground = async () => {
    if (!imageFile) return
    if (!user) return
    
    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      // Compress the image before uploading to avoid large payloads
      const compressedBlob = await compressImage(imageFile)
      const formData = new FormData()
      formData.append('image', compressedBlob, imageFile.name)

      const res = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setError('No credits remaining. Please purchase more credits or upgrade your plan.')
          return
        }
        setError(data.error ?? 'Failed to remove background. Please try again.')
        return
      }

      setResultUrl(data.resultUrl)
      setSuccess('🎉 Background removed successfully!')
      loadCredits() // Refresh remaining credits count
    } catch (err) {
      setError('Network error occurred. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const link = document.createElement('a')
    link.download = `cutout-${Date.now()}.png`
    link.href = resultUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="relative min-h-screen py-16 px-4">
      {/* Glow orbs */}
      <div className="glow-orb w-[600px] h-[600px] top-[-200px] left-[-200px]"
        style={{ background: 'radial-gradient(circle, rgba(255,45,141,0.1) 0%, transparent 70%)' }} />
      <div className="glow-orb w-[500px] h-[500px] bottom-[-100px] right-[-150px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Background Removal
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Isolate Your <span className="gradient-text">Cutouts</span> in Seconds
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Upload transparent headshots and photos. Remove backgrounds automatically with industry-leading AI models.
          </p>
        </div>

        {/* Auth status or warning banner */}
        {!authLoading && !user && (
          <div className="max-w-2xl mx-auto mb-8 glass-card p-6 border-amber-500/20 text-center animate-slide-up">
            <div className="flex justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Authentication Required</h3>
            <p className="text-white/60 text-sm mb-4">
              You need to sign in to use the background removal tool. New accounts get 2 free credits automatically!
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/auth/login?redirect=/background-removal" className="btn-secondary text-xs py-2 px-4">
                Sign In
              </Link>
              <Link href="/auth/signup?redirect=/background-removal" className="btn-primary text-xs py-2 px-4">
                Sign Up Free
              </Link>
            </div>
          </div>
        )}

        {/* User Credit Banner */}
        {user && credits !== null && (
          <div className="max-w-3xl mx-auto flex items-center justify-between mb-6 px-6 py-3 rounded-xl border border-white/5 bg-dark-800/80">
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" /> Connected account balance
            </span>
            <div className="flex items-center gap-3">
              <CreditBadge credits={credits} tier={tier} />
              {tier !== 'elite' && (
                <Link href="/pricing" className="text-xs text-brand-400 hover:underline flex items-center gap-0.5">
                  Get Unlimited <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Error / Success Notifications */}
        <div className="max-w-3xl mx-auto space-y-3 mb-6">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 animate-slide-up">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 animate-slide-up">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}
        </div>

        {/* Tool Workspace Card */}
        <div className="max-w-3xl mx-auto glass-card p-6 md:p-8 mb-12">
          
          {!originalUrl ? (
            /* Upload Drag and Drop box */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-brand-500/40 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 bg-white/5 hover:bg-brand-500/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white/40 group-hover:text-brand-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Upload your photo</h3>
              <p className="text-white/40 text-sm max-w-xs mx-auto">
                Drag & drop any image file here, or click to browse files (PNG, JPG, WEBP).
              </p>
            </div>
          ) : (
            /* Workspace display showing uploaded and completed image side-by-side */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Original View */}
                <div className="relative">
                  <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Original Image</p>
                  <div className="aspect-square rounded-xl overflow-hidden border border-white/5 bg-dark-700 flex items-center justify-center relative">
                    <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Result View */}
                <div className="relative">
                  <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Background Removed</p>
                  <div className="aspect-square rounded-xl overflow-hidden border border-white/5 bg-checkered flex items-center justify-center relative bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%228%22 height=%228%22 fill=%22%232b2b3d%22/><rect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%232b2b3d%22/><rect x=%228%22 width=%228%22 height=%228%22 fill=%22%231d1d29%22/><rect y=%228%22 width=%228%22 height=%228%22 fill=%22%231d1d29%22/></svg>')] bg-repeat">
                    {processing ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto mb-2" />
                        <span className="text-xs text-white/50">Processing cutout...</span>
                      </div>
                    ) : resultUrl ? (
                      <img src={resultUrl} alt="Background Removed" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-center text-white/30 p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-xs">Click "Remove Background" to see results</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Actions row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={resetState}
                  disabled={processing}
                  className="btn-secondary flex-1 py-3"
                >
                  Upload Another
                </button>
                
                {!resultUrl ? (
                  <button
                    onClick={handleRemoveBackground}
                    disabled={processing || !user}
                    className="btn-primary flex-1 py-3 text-sm font-semibold"
                  >
                    {processing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Remove Background {tier !== 'elite' && '(1 credit)'}</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="btn-primary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-brand hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download PNG Cutout
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Ad Placeholder for Free Users */}
        {(!user || tier === 'free') && (
          <AdPlaceholder size="leaderboard" className="mb-10" />
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Crown,
              title: 'Elite Tier Features',
              desc: 'Elite subscribers get completely unlimited background removals and priority AI generation queues.'
            },
            {
              icon: ShieldCheck,
              title: 'High Resolution PNGs',
              desc: 'Our AI isolates subject outlines cleanly at 1024×1024 pixel grid sizing for sharp, print-grade renders.'
            },
            {
              icon: Sparkles,
              title: 'Automatic Detection',
              desc: 'Supports smart subject recognition. Fits faces, objects, products, and characters automatically.'
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
