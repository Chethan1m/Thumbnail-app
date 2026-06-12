'use client'

import { useState, useRef, useCallback, useEffect, useId, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { ThumbnailCanvas, type ThumbnailCanvasHandle, type TextOverlayItem, type StickerItem } from '@/components/canvas/ThumbnailCanvas'
import { ExportButton } from '@/components/canvas/ExportButton'
import { CreditBadge } from '@/components/ui/CreditBadge'
import { AdPlaceholder } from '@/components/ui/AdPlaceholder'
import {
  Sparkles, Plus, Trash2, Type, Image as ImageIcon,
  Loader2, AlertCircle, CheckCircle, Crown, PlaySquare, Wand2,
  RefreshCw, Upload, ArrowRight
} from 'lucide-react'
import type { Tier } from '@/types/database'

interface UserData {
  credits:     { credits_remaining: number; tier: Tier; credits_reset_at: string } | null
  generations: Array<{ id: string; youtube_url: string | null; result_url: string | null; status: string; created_at: string }> | null
  user:        { email: string; id: string }
}

const DEFAULT_FONTS = ['Impact', 'Arial Black', 'Oswald', 'Bebas Neue', 'Anton', 'Roboto']

// A set of beautiful high-contrast gradient presets for quick thumbnail backgrounds
const BG_PRESETS = [
  { name: 'Sunset Glow', css: 'linear-gradient(135deg, #f97316 0%, #d97706 50%, #b45309 100%)', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f97316"/><stop offset="50%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23g)"/></svg>' },
  { name: 'Neon Purple', css: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%234c1d95"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23g)"/></svg>' },
  { name: 'Cyberpunk Red', css: 'linear-gradient(135deg, #ff0055 0%, #000000 100%)', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff0055"/><stop offset="100%" stop-color="%23000000"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23g)"/></svg>' },
  { name: 'Dark Slate', css: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="100%" stop-color="%23020617"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23g)"/></svg>' },
  { name: 'Versus Split', css: 'linear-gradient(90deg, #ff0055 50%, #0070f3 50%)', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="640" height="720" fill="%23ff0055"/><rect x="640" width="640" height="720" fill="%230070f3"/></svg>' }
]

function DashboardContent() {
  const { user, loading: authLoading } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const uid = useId()

  // User data
  const [userData, setUserData]   = useState<UserData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // Generation state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating]  = useState(false)
  const [genError, setGenError]      = useState('')
  const [successMsg, setSuccessMsg]  = useState('')

  // Canvas state
  const [bgUrl, setBgUrl]         = useState<string | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState({ x: 700, y: 150, scale: 0.8 })
  const [textOverlays, setTextOverlays] = useState<TextOverlayItem[]>([
    { id: 'default-1', text: 'YOUR TITLE HERE', x: 60, y: 60, fontSize: 80, color: '#ffffff', outline: true, outlineColor: '#000000', bold: true, font: 'Impact', bgActive: false, bgColor: '#000000', bgPadding: 12, rotation: 0 }
  ])
  const [stickers, setStickers] = useState<StickerItem[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [removingBg, setRemovingBg] = useState(false)

  const canvasRef    = useRef<ThumbnailCanvasHandle>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef    = useRef<HTMLInputElement>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/dashboard')
  }, [authLoading, user])

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const res = await fetch('/api/user')
      if (res.ok) setUserData(await res.json())
    } catch {}
    finally { setDataLoading(false) }
  }, [user])

  useEffect(() => { loadUserData() }, [loadUserData])

  // Load state from localStorage on mount (Auto-Save Restore)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('thumbai_canvas_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.bgUrl !== undefined) setBgUrl(parsed.bgUrl)
        if (parsed.overlayUrl !== undefined) setOverlayUrl(parsed.overlayUrl)
        if (parsed.overlayPos !== undefined) setOverlayPos(parsed.overlayPos)
        if (parsed.textOverlays !== undefined) setTextOverlays(parsed.textOverlays)
        if (parsed.stickers !== undefined) setStickers(parsed.stickers)
      }
    } catch (e) {
      console.error('Failed to load canvas state from localStorage', e)
    }
  }, [])

  // Save state to localStorage whenever changes occur (Auto-Save)
  useEffect(() => {
    if (user) {
      const stateToSave = {
        bgUrl,
        overlayUrl,
        overlayPos,
        textOverlays,
        stickers
      }
      localStorage.setItem('thumbai_canvas_state', JSON.stringify(stateToSave))
    }
  }, [bgUrl, overlayUrl, overlayPos, textOverlays, stickers, user])

  // Show success toast on return from Stripe
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setSuccessMsg('🎉 Subscription activated! Your credits have been provisioned.')
      loadUserData()
    }
  }, [searchParams])

  const credits    = userData?.credits?.credits_remaining ?? 0
  const tier       = userData?.credits?.tier ?? 'free'
  const resetAt    = userData?.credits?.credits_reset_at
    ? new Date(userData.credits.credits_reset_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : null

  // Clear auto-saved canvas
  const handleClearCanvas = () => {
    if (confirm('Are you sure you want to clear your current design?')) {
      setBgUrl(null)
      setOverlayUrl(null)
      setOverlayPos({ x: 700, y: 150, scale: 0.8 })
      setTextOverlays([
        { id: 'default-1', text: 'YOUR TITLE HERE', x: 60, y: 60, fontSize: 80, color: '#ffffff', outline: true, outlineColor: '#000000', bold: true, font: 'Impact', bgActive: false, bgColor: '#000000', bgPadding: 12, rotation: 0 }
      ])
      setStickers([])
      setSelectedTextId(null)
      localStorage.removeItem('thumbai_canvas_state')
    }
  }

  // ── Custom background image upload ────────────────────────
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBgUrl(url)
  }

  // ── Generate thumbnail ─────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl.trim()) return
    setGenerating(true); setGenError(''); setSuccessMsg('')

    try {
      const res = await fetch('/api/generate-thumbnail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ youtubeUrl: youtubeUrl.trim(), customPrompt }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setGenError('No credits remaining. Upgrade your plan to continue.')
          return
        }
        setGenError(data.error ?? 'Generation failed. Please try again.')
        return
      }

      setBgUrl(data.imageUrl)
      if (data.mockMode) {
        setSuccessMsg('✅ Loaded YouTube thumbnail (mock mode — add FAL_API_KEY for full AI generation).')
      } else {
        setSuccessMsg('✅ AI thumbnail generated! Drag text overlays and customize your design.')
      }
      await loadUserData()
    } catch (err) {
      setGenError('Network error. Please check your connection.')
    } finally {
      setGenerating(false)
    }
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

  // ── Photo upload + background removal ────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRemovingBg(true)
    try {
      // Compress image on the client first to speed up upload and stay under payload limits
      const compressedBlob = await compressImage(file)
      const formData = new FormData()
      formData.append('image', compressedBlob, file.name)
      
      const res = await fetch('/api/remove-background', { method: 'POST', body: formData })
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error ?? 'Background removal failed. Please upgrade or try again.')
        return
      }

      setOverlayUrl(data.resultUrl)
      setOverlayPos({ x: 700, y: 150, scale: 0.8 })
      setSelectedTextId('overlay')
      await loadUserData()
    } catch (err) {
      alert('Network error. Failed to process background removal.')
    } finally {
      setRemovingBg(false)
    }
  }

  // ── Text overlay management ───────────────────────────────
  const addTextOverlay = () => {
    const newItem: TextOverlayItem = {
      id:          `text-${Date.now()}`,
      text:        'NEW TEXT',
      x:           100,
      y:           100 + textOverlays.length * 100,
      fontSize:    60,
      color:       '#ffff00',
      outline:     true,
      outlineColor:'#000000',
      bold:        true,
      font:        'Impact',
      bgActive:    false,
      bgColor:     '#000000',
      bgPadding:   10,
      rotation:    0
    }
    setTextOverlays(prev => [...prev, newItem])
    setSelectedTextId(newItem.id)
  }

  const updateSelectedText = (updates: Partial<TextOverlayItem>) => {
    setTextOverlays(prev => prev.map(t => t.id === selectedTextId ? { ...t, ...updates } : t))
  }

  const deleteSelectedText = () => {
    setTextOverlays(prev => prev.filter(t => t.id !== selectedTextId))
    setSelectedTextId(null)
  }

  const selectedText = textOverlays.find(t => t.id === selectedTextId)

  // ── Sticker management ────────────────────────────────────
  const addSticker = (type: string) => {
    const newSticker: StickerItem = {
      id:       `sticker-${Date.now()}`,
      type:     type,
      x:        640,
      y:        360,
      scale:    1.0,
      rotation: 0
    }
    setStickers(prev => [...prev, newSticker])
    setSelectedTextId(newSticker.id)
  }

  const updateSelectedSticker = (updates: Partial<StickerItem>) => {
    setStickers(prev => prev.map(s => s.id === selectedTextId ? { ...s, ...updates } : s))
  }

  const deleteSelectedSticker = () => {
    setStickers(prev => prev.filter(s => s.id !== selectedTextId))
    setSelectedTextId(null)
  }

  const selectedSticker = stickers.find(s => s.id === selectedTextId)

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Thumbnail <span className="gradient-text">Studio</span>
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {userData?.user?.email ?? user?.email}
              {resetAt && <span className="text-white/30"> · Credits reset {resetAt}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearCanvas}
              title="Reset the canvas layout and clear auto-save memory"
              className="btn-secondary text-xs py-2 px-3 border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
            >
              Clear Canvas
            </button>
            {!dataLoading && (
              <CreditBadge credits={credits} tier={tier} />
            )}
            {tier === 'free' && (
              <Link href="/pricing" className="btn-primary text-sm py-2 px-4">
                <Crown className="w-4 h-4" /> Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Out-of-Credits Alert Warning Banner */}
        {!dataLoading && credits <= 0 && tier !== 'elite' && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 text-sm text-amber-400 animate-slide-up">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">You are out of credits!</p>
              <p className="text-xs text-white/60 mt-0.5">
                Upgrade to Pro or Elite to continue generating new AI thumbnails and removing backgrounds.
              </p>
              <Link href="/pricing" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-400 hover:underline">
                Upgrade Plan <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Success / Error toasts */}
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-5 text-sm text-green-400 animate-slide-up">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* AdSense — free tier only */}
        {tier === 'free' && (
          <AdPlaceholder size="banner" className="mb-6" />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          {/* ── LEFT PANEL: Controls ─────────────────────────────── */}
          <div className="flex flex-col gap-4">
            
            {/* Background Image Options */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-400" />
                Background Image
              </h2>
              
              {/* Presets grid */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {BG_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setBgUrl(p.url)}
                    title={p.name}
                    className="aspect-video w-full rounded-lg border border-white/10 hover:border-brand-500/40 hover:scale-105 transition-all overflow-hidden relative"
                    style={{ background: p.css }}
                  />
                ))}
              </div>

              {/* Custom background upload */}
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                id={`${uid}-bg-upload`}
                onChange={handleBgUpload}
              />
              <button
                onClick={() => bgInputRef.current?.click()}
                className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Custom Background
              </button>

              {bgUrl && (
                <button
                  onClick={() => setBgUrl(null)}
                  className="mt-2 w-full text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Reset background to gradient
                </button>
              )}
            </div>

            {/* Generate section */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-400" />
                Generate Thumbnail
              </h2>

              <form onSubmit={handleGenerate} className="space-y-3">
                <div>
                  <label htmlFor={`${uid}-yt-url`} className="block text-xs text-white/50 mb-1.5">YouTube Video URL</label>
                  <div className="relative">
                    <PlaySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400/70" />
                    <input
                      id={`${uid}-yt-url`}
                      type="text"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      className="input-field pl-9 text-sm"
                      placeholder="https://youtube.com/watch?v=..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`${uid}-prompt`} className="block text-xs text-white/50 mb-1.5">
                    Custom Prompt <span className="text-white/25">(optional)</span>
                  </label>
                  <textarea
                    id={`${uid}-prompt`}
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={2}
                    placeholder="Viral tech tutorial, dramatic lighting, shocked face..."
                  />
                </div>

                {genError && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      {genError}
                      {genError.includes('credit') && (
                        <Link href="/pricing" className="block mt-1 text-brand-400 underline">
                          Upgrade your plan →
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <button
                  id="dashboard-generate-btn"
                  type="submit"
                  disabled={generating || (credits <= 0 && tier !== 'elite')}
                  className="btn-primary w-full text-sm py-2.5"
                >
                  {generating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : <><Sparkles className="w-4 h-4" /> Generate ({credits} credit{credits !== 1 ? 's' : ''} left)</>
                  }
                </button>
              </form>
            </div>

            {/* Photo upload */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-400" />
                Upload Your Photo
                {tier === 'elite' && (
                  <span className="ml-auto text-xs badge badge-elite">
                    <Crown className="w-3 h-3" /> AI BG Removal
                  </span>
                )}
              </h2>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                id={`${uid}-photo-upload`}
                onChange={handlePhotoUpload}
              />
              <button
                id="dashboard-photo-upload-btn"
                onClick={() => {
                  if (credits <= 0 && tier !== 'elite') {
                    alert('You have 0 credits remaining. Please upgrade your plan or purchase more credits to upload images and run background removals.')
                    return
                  }
                  photoInputRef.current?.click()
                }}
                disabled={removingBg}
                className="btn-secondary w-full text-sm py-2.5"
              >
                {removingBg
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing background...</>
                  : <><Upload className="w-4 h-4" /> {overlayUrl ? 'Replace Photo' : 'Upload Photo'}</>
                }
              </button>
              {overlayUrl && (
                <button onClick={() => { setOverlayUrl(null); if (selectedTextId === 'overlay') setSelectedTextId(null); }}
                  className="mt-2 w-full text-xs text-white/30 hover:text-white/60 transition-colors">
                  Remove photo
                </button>
              )}
              {tier !== 'elite' && (
                <p className="text-xs text-white/25 mt-2 text-center">
                  Uses 1 credit per image upload for background removal
                </p>
              )}
            </div>

            {/* Stickers section */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Add Graphic Stickers
              </h2>
              
              <div className="grid grid-cols-5 gap-2">
                {[
                  { type: 'arrow', label: '↪️', title: 'Red Arrow' },
                  { type: 'play', label: '▶️', title: 'Play Icon' },
                  { type: 'fire', label: '🔥', title: 'Fire' },
                  { type: 'warning', label: '⚠️', title: 'Warning' },
                  { type: 'question', label: '❓', title: 'Question' },
                ].map(s => (
                  <button
                    key={s.type}
                    onClick={() => addSticker(s.type)}
                    title={s.title}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-brand-500/30 hover:bg-brand-500/10 transition-all text-lg"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text overlay editor */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-brand-400" />
                  Text Overlays
                </h2>
                <button
                  id="dashboard-add-text-btn"
                  onClick={addTextOverlay}
                  className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Inspector elements list */}
              <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto">
                {textOverlays.map(t => (
                  <button key={t.id}
                    onClick={() => setSelectedTextId(t.id === selectedTextId ? null : t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      t.id === selectedTextId
                        ? 'bg-brand-500/20 border border-brand-500/30 text-brand-300'
                        : 'bg-white/5 border border-white/5 text-white/60 hover:border-white/10'
                    }`}>
                    {t.text.slice(0, 28)}{t.text.length > 28 ? '…' : ''}
                  </button>
                ))}

                {stickers.map(s => (
                  <button key={s.id}
                    onClick={() => setSelectedTextId(s.id === selectedTextId ? null : s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      s.id === selectedTextId
                        ? 'bg-brand-500/20 border border-brand-500/30 text-brand-300'
                        : 'bg-white/5 border border-white/5 text-white/60 hover:border-white/10'
                    }`}>
                    <span>Sticker: {s.type.toUpperCase()}</span>
                    <span className="text-[10px] text-white/30">x:{Math.round(s.x)} y:{Math.round(s.y)}</span>
                  </button>
                ))}
                
                {overlayUrl && (
                  <button
                    onClick={() => setSelectedTextId(selectedTextId === 'overlay' ? null : 'overlay')}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      selectedTextId === 'overlay'
                        ? 'bg-brand-500/20 border border-brand-500/30 text-brand-300'
                        : 'bg-white/5 border border-white/5 text-white/60 hover:border-white/10'
                    }`}>
                    <ImageIcon className="w-3.5 h-3.5" /> Uploaded Photo
                  </button>
                )}
              </div>

              {/* Selected Photo properties */}
              {selectedTextId === 'overlay' && (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Photo Size</label>
                    <input
                      id={`${uid}-photo-scale`}
                      type="range"
                      min={0.1} max={3.0} step={0.05}
                      value={overlayPos.scale}
                      onChange={e => setOverlayPos(prev => ({ ...prev, scale: Number(e.target.value) }))}
                      className="w-full accent-brand-500"
                    />
                  </div>
                  <button onClick={() => { setOverlayUrl(null); setSelectedTextId(null) }}
                    className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Photo
                  </button>
                </div>
              )}

              {/* Selected sticker properties */}
              {selectedSticker && (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span className="font-medium">Selected Sticker: {selectedSticker.type.toUpperCase()}</span>
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Sticker Size (Scale)</label>
                    <input
                      id={`${uid}-sticker-scale`}
                      type="range"
                      min={0.1} max={3.0} step={0.05}
                      value={selectedSticker.scale}
                      onChange={e => updateSelectedSticker({ scale: Number(e.target.value) })}
                      className="w-full accent-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Sticker Rotation (°)</label>
                    <input
                      id={`${uid}-sticker-rotation`}
                      type="range"
                      min={-180} max={180} step={1}
                      value={selectedSticker.rotation ?? 0}
                      onChange={e => updateSelectedSticker({ rotation: Number(e.target.value) })}
                      className="w-full accent-brand-500"
                    />
                    <span className="text-[10px] text-white/40 text-right block">{selectedSticker.rotation ?? 0}°</span>
                  </div>

                  <button onClick={deleteSelectedSticker}
                    className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Sticker
                  </button>
                </div>
              )}

              {/* Selected text properties */}
              {selectedText && (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Text Content</label>
                    <input
                      id={`${uid}-text-content`}
                      value={selectedText.text}
                      onChange={e => updateSelectedText({ text: e.target.value })}
                      className="input-field text-sm py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Font Size</label>
                      <input
                        id={`${uid}-font-size`}
                        type="number"
                        min={12} max={200}
                        value={selectedText.fontSize}
                        onChange={e => updateSelectedText({ fontSize: Number(e.target.value) })}
                        className="input-field text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Font</label>
                      <select
                        id={`${uid}-font-family`}
                        value={selectedText.font}
                        onChange={e => updateSelectedText({ font: e.target.value })}
                        className="input-field text-sm py-2">
                        {DEFAULT_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Text Color</label>
                      <input type="color" value={selectedText.color}
                        id={`${uid}-text-color`}
                        onChange={e => updateSelectedText({ color: e.target.value })}
                        className="w-full h-9 rounded-lg border border-white/10 bg-white/5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Outline Color</label>
                      <input type="color" value={selectedText.outlineColor}
                        id={`${uid}-outline-color`}
                        onChange={e => updateSelectedText({ outlineColor: e.target.value })}
                        className="w-full h-9 rounded-lg border border-white/10 bg-white/5 cursor-pointer" />
                    </div>
                  </div>

                  {/* Rotation and style properties */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Text Rotation (°)</label>
                      <input
                        id={`${uid}-text-rotation`}
                        type="range"
                        min={-180} max={180} step={1}
                        value={selectedText.rotation ?? 0}
                        onChange={e => updateSelectedText({ rotation: Number(e.target.value) })}
                        className="w-full accent-brand-500"
                      />
                      <span className="text-[10px] text-white/40 text-right block">{selectedText.rotation ?? 0}°</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60">
                        <input type="checkbox" id={`${uid}-bold`}
                          checked={selectedText.bold}
                          onChange={e => updateSelectedText({ bold: e.target.checked })}
                          className="rounded" />
                        Bold
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60">
                        <input type="checkbox" id={`${uid}-outline`}
                          checked={selectedText.outline}
                          onChange={e => updateSelectedText({ outline: e.target.checked })}
                          className="rounded" />
                        Outline
                      </label>
                    </div>
                  </div>

                  {/* Background strip settings */}
                  <div className="space-y-2 border-t border-white/5 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60">
                      <input type="checkbox" id={`${uid}-bg-active`}
                        checked={selectedText.bgActive ?? false}
                        onChange={e => updateSelectedText({ bgActive: e.target.checked })}
                        className="rounded" />
                      Enable Background Box
                    </label>
                    
                    {selectedText.bgActive && (
                      <div className="grid grid-cols-2 gap-2 animate-fade-in">
                        <div>
                          <label className="text-[10px] text-white/40 mb-0.5 block">BG Color</label>
                          <input type="color" value={selectedText.bgColor ?? '#000000'}
                            id={`${uid}-bg-color`}
                            onChange={e => updateSelectedText({ bgColor: e.target.value })}
                            className="w-full h-8 rounded-lg border border-white/10 bg-white/5 cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 mb-0.5 block">Padding</label>
                          <input type="number" min={0} max={50} value={selectedText.bgPadding ?? 10}
                            id={`${uid}-bg-padding`}
                            onChange={e => updateSelectedText({ bgPadding: Number(e.target.value) })}
                            className="input-field text-sm py-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={deleteSelectedText}
                    className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors border-t border-white/5 pt-2 w-full">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Text
                  </button>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-400" />
                Export
              </h2>
              <ExportButton
                tier={tier}
                onExport={(t) => canvasRef.current?.exportPNG(t) ?? ''}
              />
            </div>
          </div>

          {/* ── RIGHT PANEL: Canvas ──────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <ThumbnailCanvas
              ref={canvasRef}
              backgroundUrl={bgUrl}
              overlayUrl={overlayUrl}
              overlayPos={overlayPos}
              onOverlayMove={(x, y, scale) => setOverlayPos(prev => ({ ...prev, x, y, scale: scale !== undefined ? scale : prev.scale }))}
              textOverlays={textOverlays}
              selectedId={selectedTextId}
              onSelectText={setSelectedTextId}
              onTextMove={(id, x, y) => setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))}
              stickers={stickers}
              onStickerMove={(id, x, y, scale) => setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y, scale: scale !== undefined ? scale : s.scale } : s))}
            />

            <p className="text-xs text-white/25 text-center">
              Click elements to select · Drag to position · Double finger pinch/scroll to scale photos
            </p>

            {/* Generation history */}
            {userData?.generations && userData.generations.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Generations</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {userData.generations.slice(0, 8).map(g => (
                    g.result_url ? (
                      <button key={g.id}
                        onClick={() => setBgUrl(g.result_url!)}
                        className="aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-brand-400/40 transition-all duration-200 group relative">
                        <img src={g.result_url} alt="Generated thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </button>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* AdSense rectangle slot for free users */}
            {tier === 'free' && (
              <AdPlaceholder size="rectangle" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
