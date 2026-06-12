-- ============================================================
-- ThumbAI — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. USERS TABLE (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   TEXT PRIMARY KEY,               -- Stripe subscription ID
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT NOT NULL,
  stripe_price_id      TEXT NOT NULL,
  status               TEXT NOT NULL,                  -- active | canceled | past_due | trialing
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER CREDITS TABLE
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id            UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  credits_remaining  INTEGER NOT NULL DEFAULT 2,
  tier               TEXT NOT NULL DEFAULT 'free',    -- free | pro | elite
  credits_reset_at   TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GENERATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  youtube_url     TEXT,
  prompt          TEXT,
  result_url      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',    -- pending | completed | failed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create user record + credits when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, credits_remaining, tier)
  VALUES (NEW.id, 2, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations   ENABLE ROW LEVEL SECURITY;

-- users: read/update own record only
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- subscriptions: read own only (writes via service role from webhooks)
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- user_credits: read own only (writes via service role from webhooks/API)
CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- generations: full CRUD on own records
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id    ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer   ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id      ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at   ON public.generations(created_at DESC);
