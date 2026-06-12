import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check credits and tier
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

    const isElite = creditsData.tier === 'elite'

    if (!isElite && creditsData.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Upgrade your plan or purchase credits to continue.', upgradeUrl: '/pricing' },
        { status: 402 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const hasFalKey = !!process.env.FAL_API_KEY && process.env.FAL_API_KEY !== 'dummy_fal_key'
    let resultUrl: string

    if (!hasFalKey) {
      // Mock mode: return the original image URL unchanged
      const arrayBuffer = await imageFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      resultUrl = `data:${imageFile.type};base64,${base64}`
    } else {
      const { fal } = await import('@fal-ai/client')
      fal.config({ credentials: process.env.FAL_API_KEY })

      // Convert file to base64 data URL for Fal.ai
      const arrayBuffer = await imageFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const dataUrl = `data:${imageFile.type};base64,${base64}`

      const result = await fal.subscribe('fal-ai/birefnet', {
        input: {
          image_url: dataUrl,
          model:     'General Use (Light)',
          operating_resolution: '1024x1024',
          output_format: 'png',
        },
      }) as any

      resultUrl = result.image?.url ?? dataUrl
    }

    // Deduct credit if not Elite
    if (!isElite) {
      const admin = createAdminClient()
      const { error: deductError } = await (admin as any)
        .from('user_credits')
        .update({
          credits_remaining: creditsData.credits_remaining - 1,
          updated_at:        new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (deductError) {
        console.error('[BG REMOVAL CREDIT DEDUCTION ERROR]', deductError)
        return NextResponse.json({ error: 'Failed to deduct credit balance' }, { status: 500 })
      }
    }

    return NextResponse.json({
      resultUrl,
      mockMode:   !hasFalKey,
      creditsLeft: isElite ? 999999 : creditsData.credits_remaining - 1
    })
  } catch (err) {
    console.error('[BG REMOVAL ERROR]', err)
    return NextResponse.json({ error: 'Background removal failed' }, { status: 500 })
  }
}
