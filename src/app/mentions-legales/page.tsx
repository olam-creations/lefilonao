import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Mentions légales | Le Filon AO',
  description: 'Mentions légales du site lefilonao.com - Veille marchés publics par IA.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return (
    <LegalShell title="Mentions légales" updatedAt="9 février 2026" currentPath="/mentions-legales">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>lefilonao.com</strong> est un <strong>projet personnel</strong> édité par :
      </p>
      <table>
        <tbody>
          <tr><td><strong>Raison sociale</strong></td><td>Olam Creations</td></tr>
          <tr><td><strong>Responsable</strong></td><td>Jonas Kleinschmidt</td></tr>
          <tr><td><strong>Statut</strong></td><td>Micro-entreprise (Entreprise Individuelle)</td></tr>
          <tr><td><strong>SIRET</strong></td><td>909 935 892 000 10</td></tr>
          <tr><td><strong>Code NAF</strong></td><td>6201Z — Programmation informatique</td></tr>
          <tr><td><strong>Siège social</strong></td><td>60 rue François 1er, 75008 Paris (domiciliation LegalPlace)</td></tr>
          <tr><td><strong>E-mail</strong></td><td><a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a></td></tr>
        </tbody>
      </table>

      <h2>Nature du projet</h2>
      <p>
        Le Filon AO est un projet personnel conçu, développé et opéré par une seule personne.
        Il ne s&apos;agit pas d&apos;une startup ni d&apos;une société financée. Le service est proposé en l&apos;état,
        avec un objectif de qualité et de transparence.
      </p>

      <h2>Directeur de la publication</h2>
      <p>Jonas Kleinschmidt — <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a></p>

      <h2>Hébergement</h2>
      <div>
        <p>
          <strong>Application web</strong><br />
          Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
        </p>
        <p>
          <strong>Base de données</strong><br />
          Supabase Inc. — San Francisco, CA, États-Unis<br />
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>
        </p>
        <p>
          <strong>Stockage de fichiers</strong><br />
          Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, États-Unis<br />
          <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">cloudflare.com</a>
        </p>
      </div>

      <h2>Protection des données personnelles</h2>
      <p>
        Conformément au RGPD et à la loi Informatique et Libertés, vous disposez de droits sur vos données personnelles.
        Consultez notre <a href="/politique-confidentialite">politique de confidentialité</a> pour plus d&apos;informations.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus du site (textes, logos, logiciels, algorithmes, interfaces) est protégé
        par les lois françaises et internationales relatives à la propriété intellectuelle.
        Toute reproduction sans autorisation écrite préalable est interdite.
      </p>

      <p className="text-sm text-slate-400 mt-8">© 2026 Le Filon AO — Tous droits réservés.</p>
    </LegalShell>
  );
}
