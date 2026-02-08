import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://lefilonao.com'),
  title: 'Le Filon AO | Veille appels d\'offres & alertes marchés publics par IA',
  description: 'Alertes appels d\'offres personnalisées par IA. Score Go/No-Go, BOAMP complet, 50€/mois tout inclus. Essai gratuit 14 jours.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Le Filon AO',
    title: 'Le Filon AO | Veille appels d\'offres & alertes marchés publics par IA',
    description: 'Alertes appels d\'offres personnalisées par IA. Score Go/No-Go, BOAMP complet, 50€/mois tout inclus. Essai gratuit 14 jours.',
    url: 'https://lefilonao.com',
  },
  twitter: {
    card: 'summary_large_image',
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
  offers: {
    '@type': 'Offer',
    price: '50',
    priceCurrency: 'EUR',
  },
  provider: {
    '@type': 'Organization',
    name: 'Metatron Labs',
    url: 'https://lefilonao.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-black text-white antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
