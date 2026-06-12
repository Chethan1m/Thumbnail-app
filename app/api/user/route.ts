import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let { data: credits } = await supabase
    .from('user_credits')
    .select('credits_remaining, tier, credits_reset_at')
    .eq('user_id', user.id)
    .single()

  // Fallback if trigger failed or user existed before SQL was run
  if (!credits) {
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

  const { data: generations } = await supabase
    .from('generations')
    .select('id, youtube_url, result_url, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ credits, generations, user: { email: user.email, id: user.id } })
}
