'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ExportButtonProps {
  onExport: (tier: string) => string   // returns data URL
  tier: string
}

export function ExportButton({ onExport, tier }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      // Small delay to let canvas re-render without selection box
      await new Promise(r => setTimeout(r, 50))
      const dataUrl = onExport(tier)
      if (!dataUrl) return

      const link = document.createElement('a')
      link.download = `thumbai-${Date.now()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setExporting(false)
    }
  }

  const isFree = tier === 'free'

  return (
    <div className="flex flex-col gap-2">
      <button
        id="export-png-btn"
        onClick={handleExport}
        disabled={exporting}
        title={isFree ? 'Download standard resolution PNG with watermark' : 'Download 1280×720 PNG'}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 btn-primary"
      >
        {exporting
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Download className="w-4 h-4" />}
        {isFree ? 'Export Standard PNG' : 'Export 1280×720 PNG'}
      </button>
      {isFree && (
        <p className="text-xs text-white/30 text-center">
          Standard res with watermark. Upgrade to remove.
        </p>
      )}
    </div>
  )
}
