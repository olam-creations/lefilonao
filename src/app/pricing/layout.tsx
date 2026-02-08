import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs Le Filon AO | Veille appels d\'offres dès 50€/mois',
  description: 'Un prix unique, tout inclus : 50€/mois. Essai gratuit 14 jours. 3x moins cher que MPFrance, Klekoon ou Vecteur Plus.',
  alternates: { canonical: '/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
