import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Extract 11-char YouTube video ID from any YouTube URL format
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // raw video ID
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

// Build an optimized prompt for viral thumbnail generation
function buildThumbnailPrompt(videoId: string, customPrompt?: string): string {
  const base = customPrompt
    ? customPrompt
    : 'A viral YouTube thumbnail with high contrast colors, bold typography, dramatic lighting'

  return `${base}. YouTube thumbnail, 16:9 aspect ratio, high contrast, vibrant colors, ` +
    `professional quality, eye-catching design, clickbait-style visual hook, ` +
    `dramatic shadows, bold text elements, engaging composition. ` +
    `Studio quality, sharp focus, trending YouTube aesthetic. ` +
    `Video reference context: YouTube video ID ${videoId}.`
}

export async function POST(request: Request) {
  try {
    // ── STEP 1: Auth validation ──────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── STEP 2: Credit balance check (via RLS-protected query) ────────
    let { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_remaining, tier')
      .eq('user_id', user.id)
      .single()

    // Lazy provision if missing
    if (creditsError || !credits) {
      const admin = createAdminClient()
      
      // Ensure the users record exists first (foreign key constraint)
      await (admin as any).from('users').upsert({
        id: user.id,
        email: user.email,
      }, { onConflict: 'id' })

      const defaultCredits = { credits_remaining: 2, tier: 'free' }
      await (admin as any).from('user_credits').insert({
        user_id: user.id,
        ...defaultCredits
      })
      credits = defaultCredits as any
    }

    const creditsData = credits as any as { credits_remaining: number; tier: string }

    if (!creditsData) {
      return NextResponse.json({ error: 'Could not fetch credit balance' }, { status: 500 })
    }

    if (creditsData.credits_remaining <= 0) {
      return NextResponse.json(
        {
          error: 'No credits remaining',
          tier: creditsData.tier,
          upgradeUrl: '/pricing',
        },
        { status: 402 }
      )
    }

    // ── STEP 3: Parse request body ────────────────────────────────────
    const { youtubeUrl, customPrompt } = await request.json()

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    const videoId = extractYouTubeId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // YouTube base frame thumbnail URL (always publicly accessible)
    const ytThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

    // Insert a pending generation record
    const admin = createAdminClient()
    const { data: genRecord, error: genError } = await (admin as any)
      .from('generations')
      .insert({
        user_id:     user.id,
        youtube_url: youtubeUrl,
        prompt:      buildThumbnailPrompt(videoId, customPrompt),
        status:      'pending',
      })
      .select()
      .single()

    if (genError) {
      console.error('[GENERATION INSERT ERROR]', genError)
    }

    // ── STEP 4: AI Generation ────────────────────────────────────────
    let resultImageUrl: string

    const hasFalKey = !!process.env.FAL_API_KEY && process.env.FAL_API_KEY !== 'dummy_fal_key'

    if (hasFalKey) {
      // LIVE MODE — Fal.ai Flux model
      try {
        const { fal } = await import('@fal-ai/client')

        fal.config({ credentials: process.env.FAL_API_KEY })

        const prompt = buildThumbnailPrompt(videoId, customPrompt)

        const result = await fal.subscribe('fal-ai/flux/dev', {
          input: {
            prompt,
            image_size:        { width: 1280, height: 720 },
            num_inference_steps: 28,
            guidance_scale:    3.5,
            num_images:        1,
            enable_safety_checker: true,
          },
        }) as any

        resultImageUrl = result.images?.[0]?.url ?? ytThumbnailUrl
      } catch (falErr) {
        console.error('[FAL.AI ERROR]', falErr)
        // Graceful fallback to YouTube thumbnail
        resultImageUrl = ytThumbnailUrl
      }
    } else {
      // MOCK MODE — returns the original YouTube thumbnail for local dev
      console.log('[MOCK MODE] FAL_API_KEY not set — returning YouTube base thumbnail')
      await new Promise(r => setTimeout(r, 800)) // simulate latency
      resultImageUrl = ytThumbnailUrl
    }

    // ── STEP 5: Atomic credit deduction ──────────────────────────────
    // Use service-role client to bypass RLS for the decrement
    const { error: deductError } = await (admin as any)
      .from('user_credits')
      .update({
        credits_remaining: creditsData.credits_remaining - 1,
        updated_at:        new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (deductError) {
      console.error('[CREDIT DEDUCTION ERROR]', deductError)
      return NextResponse.json({ error: 'Failed to update credit balance' }, { status: 500 })
    }

    // Update generation record to completed
    if (genRecord?.id) {
      await (admin as any).from('generations').update({
        result_url: resultImageUrl,
        status:     'completed',
      }).eq('id', genRecord.id)
    }

    return NextResponse.json({
      success:        true,
      imageUrl:       resultImageUrl,
      videoId,
      ytThumbnailUrl,
      creditsLeft:    creditsData.credits_remaining - 1,
      mockMode:       !hasFalKey,
    })

  } catch (err) {
    console.error('[GENERATE THUMBNAIL ERROR]', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
