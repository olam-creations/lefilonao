import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs Le Filon AO | Veille appels d\'offres gratuite, Pro dès 25€/mois',
  description: 'Commencez gratuitement avec 5 AO/mois. Offre Fondateur à 25€/mois pendant 6 mois. Accès illimité, score IA, intelligence acheteur.',
  alternates: { canonical: '/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
