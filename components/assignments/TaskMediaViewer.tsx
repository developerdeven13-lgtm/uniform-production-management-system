'use client'

import { useState } from 'react'
import { X, Mic, Image as ImageIcon } from 'lucide-react'

interface MediaItem {
  id: string
  media_type: string
  file_name: string
  duration_seconds: number | null
  signedUrl: string | null
}

interface Props {
  voiceNotes: MediaItem[]
  images: MediaItem[]
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}
      >
        <X style={{ width: 20, height: 20 }} />
      </button>
      <img
        src={src}
        alt=""
        style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain' }}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

export function TaskMediaViewer({ voiceNotes, images }: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <>
      {/* Voice notes */}
      {voiceNotes.length > 0 && (
        <div style={{ marginBottom: images.length > 0 ? 14 : 0 }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 8 }}>
            <Mic style={{ width: 12, height: 12 }} /> Voice Notes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {voiceNotes.map(vn => (
              <div key={vn.id} style={{ background: '#F7F5EE', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: '#888780', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mic style={{ width: 11, height: 11 }} />
                  {vn.file_name}
                  {vn.duration_seconds && <span>· {Math.round(vn.duration_seconds)}s</span>}
                </p>
                {vn.signedUrl ? (
                  <audio
                    controls
                    src={vn.signedUrl}
                    style={{ width: '100%', height: 36 }}
                    preload="metadata"
                  />
                ) : (
                  <p style={{ fontSize: 12, color: '#B4B2A9' }}>Audio unavailable</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div>
          <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 8 }}>
            <ImageIcon style={{ width: 12, height: 12 }} /> Reference Images
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map(img => (
              img.signedUrl ? (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxSrc(img.signedUrl)}
                  style={{ padding: 0, border: '0.5px solid #D3D1C7', borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in', background: 'none', aspectRatio: '1' }}
                >
                  <img
                    src={img.signedUrl}
                    alt={img.file_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ) : (
                <div
                  key={img.id}
                  style={{ background: '#F1EFE8', borderRadius: 10, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ImageIcon style={{ width: 20, height: 20, color: '#D3D1C7' }} />
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  )
}
