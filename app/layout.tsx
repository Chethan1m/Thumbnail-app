import type { Metadata } from 'next'
import { Inter, Syne } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const syne  = Syne({ subsets: ['latin'], variable: '--font-syne',  display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'ThumbAI — AI-Powered YouTube Thumbnail Maker',
    template: '%s | ThumbAI',
  },
  description:
    'Generate viral, high-contrast YouTube thumbnails instantly using AI. ' +
    'Drag-and-drop text, upload your photo, and download in 1280×720. ' +
    'Free plan available — no design skills required.',
  keywords: ['youtube thumbnail maker', 'ai thumbnail generator', 'thumbnail design', 'youtube marketing'],
  authors: [{ name: 'ThumbAI' }],
  openGraph: {
    type:      'website',
    siteName:  'ThumbAI',
    title:     'ThumbAI — AI-Powered YouTube Thumbnail Maker',
    description: 'Generate viral YouTube thumbnails with AI in seconds.',
  },
  twitter: {
    card:  'summary_large_image',
    title: 'ThumbAI — AI-Powered YouTube Thumbnail Maker',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Oswald:wght@400;700&family=Roboto:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-dark-900 text-white antialiased min-h-screen flex flex-col">
        <SupabaseProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </SupabaseProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
