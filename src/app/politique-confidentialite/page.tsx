import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Le Filon AO',
  description: 'Politique de confidentialité et protection des données personnelles de Le Filon AO.',
  alternates: { canonical: '/politique-confidentialite' },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalShell title="Politique de confidentialité" updatedAt="9 février 2026" currentPath="/politique-confidentialite">
      <h2>1. Responsable du traitement</h2>
      <p>
        <strong>Olam Creations</strong> — Jonas Kleinschmidt (projet personnel)<br />
        Micro-entreprise (EI) — SIRET 909 935 892 000 10<br />
        60 rue François 1er, 75008 Paris (domiciliation LegalPlace)<br />
        <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>
      </p>

      <h2>2. Données collectées et finalités</h2>
      <table>
        <thead>
          <tr>
            <th>Finalité</th>
            <th>Données</th>
            <th>Base légale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gestion du compte</td>
            <td>E-mail, nom, entreprise, secteurs</td>
            <td>Exécution du contrat (art. 6.1.b RGPD)</td>
          </tr>
          <tr>
            <td>Analyse IA des DCE</td>
            <td>Documents téléversés, profil</td>
            <td>Exécution du contrat (art. 6.1.b RGPD)</td>
          </tr>
          <tr>
            <td>Suivi des erreurs (Sentry)</td>
            <td>Données techniques (IP, navigateur)</td>
            <td>Consentement (art. 6.1.a RGPD)</td>
          </tr>
          <tr>
            <td>Analytiques (Plausible)</td>
            <td>Données agrégées anonymes</td>
            <td>Intérêt légitime (art. 6.1.f RGPD)</td>
          </tr>
          <tr>
            <td>Feedback utilisateur</td>
            <td>E-mail, catégorie, message</td>
            <td>Intérêt légitime (art. 6.1.f RGPD)</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Destinataires des données</h2>
      <p>Vos données peuvent être transmises aux sous-traitants suivants :</p>
      <ul>
        <li><strong>Anthropic</strong> (Claude AI) — Analyse documentaire IA, San Francisco, USA</li>
        <li><strong>Google</strong> (Gemini AI) — Génération de contenu IA, Mountain View, USA</li>
        <li><strong>NVIDIA</strong> (Llama AI via NIM) — Analyse IA de secours, Santa Clara, USA</li>
        <li><strong>Stripe</strong> — Traitement des paiements, San Francisco, USA</li>
        <li><strong>Sentry</strong> — Suivi des erreurs applicatives, San Francisco, USA</li>
        <li><strong>Plausible Analytics</strong> — Analytiques web sans cookies, UE</li>
        <li><strong>Vercel</strong> — Hébergement, San Francisco, USA</li>
        <li><strong>Supabase</strong> — Base de données, San Francisco, USA</li>
        <li><strong>Cloudflare</strong> (R2) — Stockage de fichiers, San Francisco, USA</li>
        <li><strong>Resend</strong> — Envoi d&apos;e-mails transactionnels, San Francisco, USA</li>
      </ul>

      <h2>4. Transferts internationaux</h2>
      <p>
        Certains sous-traitants sont situés aux États-Unis. Ces transferts sont encadrés par le
        EU-US Data Privacy Framework (décision d&apos;adéquation du 10 juillet 2023)
        et/ou par des clauses contractuelles types approuvées par la Commission européenne.
      </p>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li><strong>Données de compte</strong> : durée du contrat + 3 ans</li>
        <li><strong>Documents téléversés (DCE)</strong> : durée du contrat, supprimés à la clôture</li>
        <li><strong>Feedback utilisateur</strong> : 2 ans</li>
        <li><strong>Logs techniques</strong> : 12 mois</li>
        <li><strong>Données de facturation</strong> : 10 ans (obligation légale)</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Accès</strong> (art. 15) — Obtenir une copie de vos données</li>
        <li><strong>Rectification</strong> (art. 16) — Corriger des données inexactes</li>
        <li><strong>Effacement</strong> (art. 17) — Supprimer vos données</li>
        <li><strong>Portabilité</strong> (art. 20) — Récupérer vos données dans un format lisible</li>
        <li><strong>Opposition</strong> (art. 21) — Vous opposer au traitement</li>
        <li><strong>Limitation</strong> (art. 18) — Restreindre le traitement</li>
      </ul>
      <p>
        Contact : <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>.
        Réponse sous 1 mois maximum.
      </p>
      <p>
        Vous pouvez également saisir la <strong>CNIL</strong> :{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
      </p>

      <h2>7. Cookies</h2>
      <ul>
        <li>
          <strong>Cookies essentiels</strong> — Authentification et préférences.
          Exemptés de consentement (art. 82 loi Informatique et Libertés).
        </li>
        <li>
          <strong>Sentry</strong> — Suivi d&apos;erreurs. Déposé uniquement avec votre consentement.
        </li>
        <li>
          <strong>Plausible Analytics</strong> — Sans cookie, sans donnée personnelle. Ne nécessite pas de consentement.
        </li>
      </ul>

      <h2>8. Transparence IA (EU AI Act, art. 50)</h2>
      <p>Le Filon AO utilise l&apos;intelligence artificielle pour :</p>
      <ul>
        <li>Scorer les appels d&apos;offres (Go / Maybe / Pass)</li>
        <li>Analyser les Dossiers de Consultation (DCE)</li>
        <li>Générer des brouillons de mémoire technique</li>
        <li>Fournir des suggestions via le Coach IA</li>
      </ul>
      <p>
        Ces résultats sont indicatifs et ne constituent pas un conseil juridique ou professionnel.
        Fournisseurs IA : Anthropic (Claude), Google (Gemini), NVIDIA (Llama).
        Aucune donnée utilisateur n&apos;est utilisée pour entraîner ces modèles.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Cette politique peut être modifiée à tout moment.
        Les modifications seront publiées sur cette page avec la date de mise à jour.
      </p>
    </LegalShell>
  );
}
