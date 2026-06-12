'use client'

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface TextOverlayItem {
  id:        string
  text:      string
  x:         number
  y:         number
  fontSize:  number
  color:     string
  outline:   boolean
  outlineColor: string
  bold:      boolean
  font:      string
  bgActive?:   boolean
  bgColor?:    string
  bgPadding?:  number
  rotation?:   number // angle in degrees
}

export interface StickerItem {
  id:        string
  type:      string // 'arrow' | 'play' | 'fire' | 'warning' | 'question'
  x:         number
  y:         number
  scale:     number
  rotation:  number // angle in degrees
}

interface ThumbnailCanvasProps {
  backgroundUrl: string | null
  overlayUrl:    string | null
  overlayPos:    { x: number; y: number; scale: number }
  onOverlayMove: (x: number, y: number, scale?: number) => void
  textOverlays:  TextOverlayItem[]
  onTextMove:    (id: string, x: number, y: number) => void
  selectedId:    string | null // 'overlay' if the image is selected, otherwise text/sticker id
  onSelectText:  (id: string | null) => void
  stickers?:     StickerItem[]
  onStickerMove?: (id: string, x: number, y: number, scale?: number) => void
}

export interface ThumbnailCanvasHandle {
  exportPNG: (tier: string) => string
}

const CANVAS_W = 1280
const CANVAS_H = 720

export const ThumbnailCanvas = forwardRef<ThumbnailCanvasHandle, ThumbnailCanvasProps>(
  ({ backgroundUrl, overlayUrl, overlayPos, onOverlayMove, textOverlays, onTextMove, selectedId, onSelectText, stickers = [], onStickerMove }, ref) => {
    const canvasRef  = useRef<HTMLCanvasElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const bgImg      = useRef<HTMLImageElement | null>(null)
    const overlayImg = useRef<HTMLImageElement | null>(null)
    const dragging   = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
    const [scale, setScale] = useState(1)
    const touchStartDist = useRef<number | null>(null)
    const touchStartScale = useRef<number>(1)

    // Compute display scale (fit canvas to wrapper width)
    useEffect(() => {
      const update = () => {
        if (wrapperRef.current) {
          setScale(wrapperRef.current.clientWidth / CANVAS_W)
        }
      }
      update()
      const ro = new ResizeObserver(update)
      if (wrapperRef.current) ro.observe(wrapperRef.current)
      return () => ro.disconnect()
    }, [])

    // Load background image
    useEffect(() => {
      if (!backgroundUrl) { bgImg.current = null; draw(); return }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { bgImg.current = img; draw() }
      img.onerror = () => { bgImg.current = null; draw() }
      img.src = backgroundUrl
    }, [backgroundUrl])

    // Load overlay image
    useEffect(() => {
      if (!overlayUrl) { overlayImg.current = null; draw(); return }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { overlayImg.current = img; draw() }
      img.onerror = () => { overlayImg.current = null; draw() }
      img.src = overlayUrl
    }, [overlayUrl])

    const draw = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      // Background
      if (bgImg.current) {
        ctx.drawImage(bgImg.current, 0, 0, CANVAS_W, CANVAS_H)
      } else {
        // Gradient placeholder
        const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
        grad.addColorStop(0, '#1e1e35')
        grad.addColorStop(1, '#0f0f1e')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      }

      // Overlay (headshot with bg removed)
      if (overlayImg.current) {
        const ow = overlayImg.current.width * overlayPos.scale
        const oh = overlayImg.current.height * overlayPos.scale
        ctx.drawImage(overlayImg.current, overlayPos.x, overlayPos.y, ow, oh)
        
        // Selection indicator for overlay
        if (selectedId === 'overlay') {
          ctx.strokeStyle = '#ff2d8d'
          ctx.lineWidth   = 2
          ctx.setLineDash([6, 3])
          ctx.strokeRect(overlayPos.x - 4, overlayPos.y - 4, ow + 8, oh + 8)
          ctx.setLineDash([])
        }
      }

      // Draw stickers (below text overlays)
      if (stickers) {
        stickers.forEach(s => {
          ctx.save()
          ctx.translate(s.x, s.y)
          ctx.rotate(((s.rotation ?? 0) * Math.PI) / 180)
          
          const size = 120 * s.scale
          
          if (s.type === 'arrow') {
            // Draw a high-contrast red curved arrow
            ctx.fillStyle = '#ff0033'
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 6
            ctx.lineJoin = 'round'
            
            // Draw arrow path
            ctx.beginPath()
            ctx.moveTo(-size / 2, size / 4)
            // Curved body
            ctx.quadraticCurveTo(-size / 4, -size / 4, size / 4, -size / 4)
            // Arrow head
            ctx.lineTo(size / 6, -size / 2)
            ctx.lineTo(size / 2, -size / 5)
            ctx.lineTo(size / 4, size / 10)
            ctx.lineTo(size / 6, -size / 10)
            ctx.quadraticCurveTo(-size / 6, -size / 10, -size / 2, size / 4)
            ctx.closePath()
            
            ctx.stroke()
            ctx.fill()
          } else if (s.type === 'play') {
            // YouTube Play Button
            // Draw red rounded box
            ctx.fillStyle = '#ff0000'
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 4
            const r = size * 0.2
            const w = size
            const h = size * 0.7
            
            ctx.beginPath()
            ctx.roundRect(-w/2, -h/2, w, h, r)
            ctx.fill()
            ctx.stroke()
            
            // Draw white triangle in center
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            const tw = size * 0.25
            ctx.moveTo(-tw/2, -tw)
            ctx.lineTo(tw, 0)
            ctx.lineTo(-tw/2, tw)
            ctx.closePath()
            ctx.fill()
          } else if (s.type === 'fire') {
            // Fire Emoji 🔥
            ctx.font = `${size}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🔥', 0, 0)
          } else if (s.type === 'warning') {
            // Warning Triangle ⚠️
            ctx.fillStyle = '#ffcc00'
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 6
            ctx.lineJoin = 'round'
            
            ctx.beginPath()
            ctx.moveTo(0, -size/2)
            ctx.lineTo(size/2, size/2)
            ctx.lineTo(-size/2, size/2)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            
            // Exclamation mark
            ctx.fillStyle = '#000000'
            ctx.font = `bold ${size * 0.6}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('!', 0, size * 0.1)
          } else if (s.type === 'question') {
            // Question mark emoji
            ctx.font = `${size}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('❓', 0, 0)
          }
          
          // Selection indicator for sticker
          if (s.id === selectedId) {
            ctx.strokeStyle = '#ff2d8d'
            ctx.lineWidth   = 2
            ctx.setLineDash([6, 3])
            ctx.strokeRect(-size/2 - 4, -size/2 - 4, size + 8, size + 8)
            ctx.setLineDash([])
          }
          
          ctx.restore()
        })
      }

      // Text overlays
      textOverlays.forEach(t => {
        ctx.save()

        const rot = t.rotation ?? 0
        const fontSize = t.fontSize
        const fontStr = `${t.bold ? 'bold ' : ''}${fontSize}px ${t.font}`
        ctx.font = fontStr
        ctx.textBaseline = 'top'

        // Translate to text coordinate and rotate
        ctx.translate(t.x, t.y)
        ctx.rotate((rot * Math.PI) / 180)

        // Draw background box if active
        if (t.bgActive) {
          const metrics = ctx.measureText(t.text)
          const w = metrics.width
          const h = fontSize * 1.2
          const pad = t.bgPadding ?? (fontSize * 0.15)
          
          ctx.fillStyle = t.bgColor ?? 'rgba(0, 0, 0, 0.8)'
          ctx.beginPath()
          ctx.roundRect(-pad, -pad, w + pad * 2, h + pad * 2, fontSize * 0.1)
          ctx.fill()
        }

        if (t.outline) {
          ctx.strokeStyle = t.outlineColor
          ctx.lineWidth   = fontSize * 0.12
          ctx.lineJoin    = 'round'
          ctx.strokeText(t.text, 0, 0)
        }

        ctx.fillStyle = t.color
        ctx.fillText(t.text, 0, 0)

        // Selection indicator
        if (t.id === selectedId) {
          const metrics = ctx.measureText(t.text)
          const w = metrics.width
          const h = fontSize * 1.2
          const pad = t.bgActive ? (t.bgPadding ?? (fontSize * 0.15)) : 0
          ctx.strokeStyle = '#ff2d8d'
          ctx.lineWidth   = 2
          ctx.setLineDash([6, 3])
          ctx.strokeRect(-pad - 4, -pad - 4, w + pad * 2 + 8, h + pad * 2 + 8)
          ctx.setLineDash([])
        }

        ctx.restore()
      })
    }, [textOverlays, selectedId, overlayPos, overlayUrl, backgroundUrl, stickers])

    useEffect(() => { draw() }, [draw])

    // Autorefresh drawing when web fonts load ( Anton, Bebas Neue, Oswald, Roboto )
    useEffect(() => {
      if (typeof document !== 'undefined') {
        document.fonts.ready.then(() => {
          draw()
        })
      }
    }, [draw])

    // Mouse wheel/trackpad scroll-to-scale gesture
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const handleWheel = (e: WheelEvent) => {
        if (!selectedId) return
        
        // Prevent default page scroll and scale the selected item
        e.preventDefault()

        const delta = e.deltaY < 0 ? 0.05 : -0.05

        if (selectedId === 'overlay') {
          const newScale = Math.max(0.1, Math.min(3.0, overlayPos.scale + delta))
          onOverlayMove(overlayPos.x, overlayPos.y, newScale)
        } else if (onStickerMove) {
          const stickerItem = stickers.find(s => s.id === selectedId)
          if (stickerItem) {
            const newScale = Math.max(0.1, Math.min(3.0, stickerItem.scale + delta))
            onStickerMove(stickerItem.id, stickerItem.x, stickerItem.y, newScale)
          }
        }
      }

      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }, [selectedId, overlayPos, stickers, onOverlayMove, onStickerMove])

    // Canvas → actual coord conversion
    const clientToCanvas = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current!
      const rect   = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top)  / scale,
      }
    }

    const hitTestItem = (cx: number, cy: number): string | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const ctx = canvas.getContext('2d')!

      // Reverse iterate text (top layers first)
      for (let i = textOverlays.length - 1; i >= 0; i--) {
        const t = textOverlays[i]
        const rot = t.rotation ?? 0
        const rad = (-rot * Math.PI) / 180
        
        // Transform hit coordinates to text's local coordinate space
        const rx = cx - t.x
        const ry = cy - t.y
        const tx = rx * Math.cos(rad) - ry * Math.sin(rad)
        const ty = rx * Math.sin(rad) + ry * Math.cos(rad)
        
        ctx.font = `${t.bold ? 'bold ' : ''}${t.fontSize}px ${t.font}`
        const w = ctx.measureText(t.text).width
        const h = t.fontSize * 1.2
        const pad = t.bgActive ? (t.bgPadding ?? (t.fontSize * 0.15)) : 0
        
        if (tx >= -pad - 4 && tx <= w + pad + 4 && ty >= -pad - 4 && ty <= h + pad + 4) {
          return t.id
        }
      }

      // Check stickers
      if (stickers) {
        for (let i = stickers.length - 1; i >= 0; i--) {
          const s = stickers[i]
          const rot = s.rotation ?? 0
          const rad = (-rot * Math.PI) / 180
          
          // Transform coordinates to sticker's local space
          const rx = cx - s.x
          const ry = cy - s.y
          const tx = rx * Math.cos(rad) - ry * Math.sin(rad)
          const ty = rx * Math.sin(rad) + ry * Math.cos(rad)
          
          const size = 120 * s.scale
          const half = size / 2
          if (tx >= -half - 4 && tx <= half + 4 && ty >= -half - 4 && ty <= half + 4) {
            return s.id
          }
        }
      }
      
      // Check overlay image (bottom layer, checked last)
      if (overlayUrl && overlayImg.current) {
        const ow = overlayImg.current.width * overlayPos.scale
        const oh = overlayImg.current.height * overlayPos.scale
        if (cx >= overlayPos.x && cx <= overlayPos.x + ow && cy >= overlayPos.y && cy <= overlayPos.y + oh) {
          return 'overlay'
        }
      }
      
      return null
    }

    const startDrag = (cx: number, cy: number, hit: string) => {
      onSelectText(hit)
      if (hit === 'overlay') {
        dragging.current = { id: hit, startX: cx, startY: cy, origX: overlayPos.x, origY: overlayPos.y }
      } else {
        const textItem = textOverlays.find(t => t.id === hit)
        if (textItem) {
          dragging.current = { id: hit, startX: cx, startY: cy, origX: textItem.x, origY: textItem.y }
        } else {
          const stickerItem = stickers.find(s => s.id === hit)
          if (stickerItem) {
            dragging.current = { id: hit, startX: cx, startY: cy, origX: stickerItem.x, origY: stickerItem.y }
          }
        }
      }
    }

    const moveDrag = (cx: number, cy: number) => {
      if (!dragging.current) return
      const dx = cx - dragging.current.startX
      const dy = cy - dragging.current.startY
      
      if (dragging.current.id === 'overlay') {
        onOverlayMove(dragging.current.origX + dx, dragging.current.origY + dy)
      } else {
        const textItem = textOverlays.find(t => t.id === dragging.current!.id)
        if (textItem) {
          onTextMove(dragging.current.id, dragging.current.origX + dx, dragging.current.origY + dy)
        } else if (onStickerMove) {
          onStickerMove(dragging.current.id, dragging.current.origX + dx, dragging.current.origY + dy)
        }
      }
    }

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
      const { x, y } = clientToCanvas(e.clientX, e.clientY)
      const hit = hitTestItem(x, y)
      if (hit) startDrag(x, y, hit)
      else onSelectText(null)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!dragging.current) return
      const { x, y } = clientToCanvas(e.clientX, e.clientY)
      moveDrag(x, y)
    }

    const handleMouseUp = () => { 
      dragging.current = null
      touchStartDist.current = null
    }

    // Touch events for mobile/tablet support
    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Multi-touch pinch zoom
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        touchStartDist.current = dist
        if (selectedId === 'overlay') {
          touchStartScale.current = overlayPos.scale
        } else {
          const stickerItem = stickers.find(s => s.id === selectedId)
          if (stickerItem) {
            touchStartScale.current = stickerItem.scale
          }
        }
        return
      }

      const touch = e.touches[0]
      if (!touch) return
      const { x, y } = clientToCanvas(touch.clientX, touch.clientY)
      const hit = hitTestItem(x, y)
      if (hit) {
        // Prevent default scrolling only when dragging an interactive item
        e.preventDefault()
        startDrag(x, y, hit)
      } else {
        onSelectText(null)
      }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist.current !== null) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        const factor = dist / touchStartDist.current
        const newScale = Math.max(0.1, Math.min(3.0, touchStartScale.current * factor))

        if (selectedId === 'overlay') {
          onOverlayMove(overlayPos.x, overlayPos.y, newScale)
        } else if (onStickerMove) {
          const stickerItem = stickers.find(s => s.id === selectedId)
          if (stickerItem) {
            onStickerMove(stickerItem.id, stickerItem.x, stickerItem.y, newScale)
          }
        }
        return
      }

      if (!dragging.current) return
      const touch = e.touches[0]
      if (!touch) return
      e.preventDefault()
      const { x, y } = clientToCanvas(touch.clientX, touch.clientY)
      moveDrag(x, y)
    }

    // Expose export function
    useImperativeHandle(ref, () => ({
      exportPNG: (tier: string) => {
        const previousSelection = selectedId
        onSelectText(null) // Clear selection outline
        draw() // Redraw

        let data = ''
        const canvas = canvasRef.current
        if (canvas) {
          if (tier === 'free') {
            // Downscale to 854x480 (standard resolution)
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = 854
            tempCanvas.height = 480
            const tempCtx = tempCanvas.getContext('2d')
            
            if (tempCtx) {
              // Draw scaled original canvas
              tempCtx.drawImage(canvas, 0, 0, 854, 480)
              
              // Draw text watermark in the bottom right
              tempCtx.save()
              tempCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'
              tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
              tempCtx.lineWidth = 3
              tempCtx.font = 'bold 16px sans-serif'
              tempCtx.textBaseline = 'bottom'
              tempCtx.textAlign = 'right'
              
              const watermarkText = 'Created with ThumbAI'
              tempCtx.strokeText(watermarkText, 854 - 15, 480 - 15)
              tempCtx.fillText(watermarkText, 854 - 15, 480 - 15)
              tempCtx.restore()
              
              data = tempCanvas.toDataURL('image/png', 1.0)
            } else {
              data = canvas.toDataURL('image/png', 1.0)
            }
          } else {
            // Full resolution 1280x720 PNG
            data = canvas.toDataURL('image/png', 1.0)
          }
        }

        onSelectText(previousSelection) // Restore selection outline
        draw()
        return data
      }
    }))

    return (
      <div ref={wrapperRef} className="w-full rounded-xl overflow-hidden border border-white/10 cursor-crosshair touch-none"
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onTouchCancel={handleMouseUp}
        />
      </div>
    )
  }
)

ThumbnailCanvas.displayName = 'ThumbnailCanvas'
