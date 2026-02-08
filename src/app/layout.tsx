import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FilonAO | Trouvez le filon des marches publics',
  description: 'Alertes appels d\'offres qui matchent votre expertise. Score Go/No-Go IA. 3 AO/mois gratuits.',
  openGraph: {
    title: 'FilonAO - Le filon des marches publics',
    description: 'Recevez uniquement les AO qui vous correspondent. Gratuit.',
    url: 'https://filonao.com',
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
