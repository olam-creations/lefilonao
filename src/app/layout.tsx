import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import CookieBanner from '@/components/CookieBanner';
import FeedbackWidget from '@/components/FeedbackWidget';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://lefilonao.com'),
  title: 'Le Filon AO | Veille appels d\'offres & alertes marchés publics par IA',
  description: 'Alertes appels d\'offres personnalisées par IA. Score Go/No-Go, BOAMP complet. Gratuit pour commencer, Pro dès 25€/mois.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Le Filon AO',
    title: 'Le Filon AO | Veille appels d\'offres & alertes marchés publics par IA',
    description: 'Alertes appels d\'offres personnalisées par IA. Score Go/No-Go, BOAMP complet. Gratuit pour commencer, Pro dès 25€/mois.',
    url: 'https://lefilonao.com',
    images: [{
      url: 'https://lefilonao.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Le Filon AO - Veille appels d\'offres par IA',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://lefilonao.com/og-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Le Filon AO',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://lefilonao.com',
  description: 'Alertes appels d\'offres personnalisées par IA avec score Go/No-Go',
  offers: [
    {
      '@type': 'Offer',
      name: 'Gratuit',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      description: '5 appels d\'offres par mois, score Go/No-Go',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '50',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      description: 'AO illimités, analyse DCE, aide rédaction, intelligence marché',
    },
  ],
  provider: {
    '@type': 'Organization',
    name: 'Le Filon AO',
    url: 'https://lefilonao.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <FeedbackWidget />
        <CookieBanner />
      </body>
    </html>
  );
}
