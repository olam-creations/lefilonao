import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation | Le Filon AO',
  description: 'Conditions générales d\'utilisation du service Le Filon AO - Veille marchés publics par IA.',
  alternates: { canonical: '/cgu' },
};

export default function CguPage() {
  return (
    <LegalShell title="Conditions générales d'utilisation" updatedAt="10 février 2026" currentPath="/cgu">
      <h2>1. Objet</h2>
      <p>
        Les présentes CGU régissent l&apos;accès et l&apos;utilisation du service Le Filon AO,
        accessible à l&apos;adresse <a href="https://lefilonao.com">lefilonao.com</a>.
      </p>
      <p>
        Le Filon AO est un <strong>projet personnel</strong> édité par Jonas Kleinschmidt,
        sous le nom commercial <strong>Olam Creations</strong> (micro-entreprise, SIRET 909 935 892 000 10).
        L&apos;inscription implique l&apos;acceptation pleine et entière des présentes CGU.
      </p>

      <h2>2. Définitions</h2>
      <ul>
        <li><strong>« Service »</strong> : la plateforme Le Filon AO et l&apos;ensemble de ses fonctionnalités</li>
        <li><strong>« Utilisateur »</strong> : toute personne inscrite au Service</li>
        <li><strong>« Éditeur »</strong> : Jonas Kleinschmidt / Olam Creations</li>
        <li><strong>« AO »</strong> : Appel d&apos;Offres publié dans le cadre de la commande publique</li>
        <li><strong>« DCE »</strong> : Dossier de Consultation des Entreprises</li>
      </ul>

      <h2>3. Inscription et compte</h2>
      <p>
        L&apos;accès au Service nécessite la création d&apos;un compte avec des informations exactes et à jour.
        L&apos;Utilisateur est responsable de la confidentialité de ses identifiants.
      </p>

      <h2>4. Description du service</h2>
      <p>Le Filon AO propose :</p>
      <ul>
        <li>Veille automatisée sur les marchés publics (source : BOAMP)</li>
        <li>Scoring IA Go/No-Go selon le profil de l&apos;Utilisateur</li>
        <li>Analyse automatisée des DCE par intelligence artificielle</li>
        <li>Aide à la rédaction de mémoires techniques</li>
        <li>Intelligence de marché et données concurrentielles (source : DECP)</li>
        <li>Watchlist acheteurs — surveillance des comptes clés et alertes de publication</li>
      </ul>

      <h2>5. Obligations de l&apos;Utilisateur</h2>
      <ul>
        <li>Utiliser le Service conformément à sa destination professionnelle</li>
        <li>Ne pas tenter d&apos;accéder à des données non autorisées</li>
        <li>Ne pas perturber le fonctionnement du Service</li>
        <li>Respecter les droits de propriété intellectuelle</li>
      </ul>

      <h2>6. Utilisations interdites</h2>
      <ul>
        <li>Utilisation à des fins illégales ou frauduleuses</li>
        <li>Scraping ou extraction systématique des données</li>
        <li>Revente du contenu généré par l&apos;IA sans vérification préalable</li>
        <li>Usurpation d&apos;identité ou partage d&apos;identifiants</li>
      </ul>

      <h2>7. Propriété intellectuelle</h2>
      <p>
        Le Service (code source, algorithmes, interface, contenus) est protégé par le droit
        de la propriété intellectuelle. L&apos;Utilisateur conserve la propriété de ses données et documents téléversés.
      </p>

      <h2>8. Responsabilité et limitations</h2>
      <p>
        <strong>Les résultats de l&apos;IA sont fournis à titre indicatif.</strong> Ils ne constituent
        pas un conseil juridique, financier ou professionnel. L&apos;Utilisateur reste seul responsable
        de ses décisions et de la vérification du contenu généré.
      </p>
      <p>
        L&apos;Éditeur s&apos;efforce d&apos;assurer la disponibilité du Service mais ne garantit pas un accès
        ininterrompu. S&apos;agissant d&apos;un projet personnel, les moyens mobilisés sont proportionnés
        à la taille du projet. L&apos;Éditeur ne saurait être tenu responsable des dommages indirects.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans notre{' '}
        <a href="/politique-confidentialite">politique de confidentialité</a>.
      </p>

      <h2>10. Suspension et résiliation</h2>
      <p>
        L&apos;Éditeur se réserve le droit de suspendre ou résilier l&apos;accès d&apos;un Utilisateur
        en cas de violation des présentes CGU. L&apos;Utilisateur peut supprimer son compte
        à tout moment depuis son espace client ou par e-mail.
      </p>

      <h2>11. Modification des CGU</h2>
      <p>
        Les présentes CGU peuvent être modifiées à tout moment. Les Utilisateurs seront informés
        par e-mail ou par notification. La poursuite de l&apos;utilisation vaut acceptation.
      </p>

      <h2>12. Loi applicable</h2>
      <p>
        Les présentes CGU sont régies par le droit français. En cas de litige,
        les parties s&apos;engagent à rechercher une solution amiable. À défaut,
        les tribunaux compétents de Paris seront seuls compétents.
      </p>

      <h2>13. Contact</h2>
      <p>
        <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>
      </p>
    </LegalShell>
  );
}
