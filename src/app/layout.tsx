import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Le Filon AO | Trouvez le filon des marches publics',
  description: 'Alertes appels d\'offres qui matchent votre expertise. Score Go/No-Go IA. 3 AO/mois gratuits.',
  openGraph: {
    title: 'Le Filon AO - Trouvez votre filon',
    description: 'Recevez uniquement les AO qui vous correspondent. Gratuit.',
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
        {children}
      </body>
    </html>
  );
}
