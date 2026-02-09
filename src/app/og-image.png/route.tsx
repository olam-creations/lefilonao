import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            AO
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: 'white',
            }}
          >
            Le Filon AO
          </span>
        </div>

        <div
          style={{
            fontSize: '28px',
            color: '#a5b4fc',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Veille appels d&apos;offres &amp; alertes
          marchés publics par IA
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          {['Score Go/No-Go', 'Analyse DCE', 'Aide rédaction'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#c7d2fe',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            color: '#64748b',
            fontSize: '16px',
          }}
        >
          lefilonao.com — Gratuit pour commencer, Pro à 30€/mois
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
