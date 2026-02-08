import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Abonnement activé | Le Filon AO',
  robots: { index: false, follow: false },
}

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
