import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alertes Appels d\'Offres | Veille Marches Publics',
  description: 'Recevez les appels d\'offres qui matchent votre expertise. Score Go/No-Go IA. Gratuit.',
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
