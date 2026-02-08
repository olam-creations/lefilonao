import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription Le Filon AO | Configurez vos alertes appels d\'offres',
  description: 'Créez votre profil en 2 minutes. Recevez des alertes ciblées pour les marchés publics qui matchent votre expertise.',
  alternates: { canonical: '/subscribe' },
}

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children
}
