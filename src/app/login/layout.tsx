import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion | Le Filon AO - Tableau de bord marchés publics',
  description: 'Connectez-vous à votre tableau de bord Le Filon AO pour consulter vos appels d\'offres, analyser les DCE et préparer vos réponses avec l\'IA.',
  alternates: { canonical: '/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
