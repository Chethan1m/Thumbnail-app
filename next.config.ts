import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '*.fal.ai' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Required for Stripe webhook signature verification
  // (raw body must be read, not parsed)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
