import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs Le Filon AO | Veille appels d\'offres gratuite, Pro à 30€/mois',
  description: 'Commencez gratuitement avec 5 AO/mois. Pro à 30€/mois : accès illimité, score IA, intelligence acheteur. 3x moins cher que la concurrence.',
  alternates: { canonical: '/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
