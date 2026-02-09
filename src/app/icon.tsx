import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Diagonal accent line (filon/vein) */}
        <div
          style={{
            position: 'absolute',
            width: 40,
            height: 3,
            background: 'rgba(255,255,255,0.15)',
            transform: 'rotate(-45deg)',
            top: 6,
            left: -2,
          }}
        />
        <span
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  )
}
