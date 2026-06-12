// ============================================================
// ThumbAI — TypeScript Database Types
// Auto-generated to match supabase/migrations/001_initial_schema.sql
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Tier = 'free' | 'pro' | 'elite'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
export type GenerationStatus = 'pending' | 'completed' | 'failed'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          email?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_price_id: string
          status: SubscriptionStatus
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_price_id: string
          status: SubscriptionStatus
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: SubscriptionStatus
          stripe_price_id?: string
          current_period_end?: string | null
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          user_id: string
          credits_remaining: number
          tier: Tier
          credits_reset_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          credits_remaining?: number
          tier?: Tier
          credits_reset_at?: string
          updated_at?: string
        }
        Update: {
          credits_remaining?: number
          tier?: Tier
          credits_reset_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          youtube_url: string | null
          prompt: string | null
          result_url: string | null
          status: GenerationStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          youtube_url?: string | null
          prompt?: string | null
          result_url?: string | null
          status?: GenerationStatus
          created_at?: string
        }
        Update: {
          result_url?: string | null
          status?: GenerationStatus
        }
      }
    }
  }
}

// Convenience row types
export type UserRow         = Database['public']['Tables']['users']['Row']
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
export type UserCreditsRow  = Database['public']['Tables']['user_credits']['Row']
export type GenerationRow   = Database['public']['Tables']['generations']['Row']

// Credit allocation per tier
export const TIER_CREDITS: Record<Tier, number> = {
  free:  2,
  pro:   100,
  elite: 999999,
}

// Stripe Price IDs → Tier mapping helper
export function getTierFromPriceId(priceId: string): Tier {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)   return 'pro'
  if (priceId === process.env.STRIPE_ELITE_PRICE_ID) return 'elite'
  return 'free'
}
