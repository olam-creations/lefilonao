import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialit\u00e9 | Le Filon AO',
  description: 'Politique de confidentialit\u00e9 et protection des donn\u00e9es personnelles de Le Filon AO.',
  alternates: { canonical: '/politique-confidentialite' },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <article className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors mb-8 inline-block">&larr; Retour &agrave; l&apos;accueil</Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Politique de confidentialit&eacute;</h1>
        <p className="text-sm text-slate-400 mb-10">Derni&egrave;re mise &agrave; jour : 9 f&eacute;vrier 2026</p>

        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600">
          <h2>1. Responsable du traitement</h2>
          <p>
            <strong>Olam Creations</strong> &mdash; Jonas Kleinschmidt<br />
            Micro-entreprise (EI) &mdash; SIRET 909 935 892 000 10<br />
            Si&egrave;ge social : 60 rue Fran&ccedil;ois 1er, 75008 Paris, France (domiciliation LegalPlace)<br />
            E-mail : <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>
          </p>

          <h2>2. Donn&eacute;es collect&eacute;es et finalit&eacute;s</h2>
          <table>
            <thead>
              <tr>
                <th>Finalit&eacute;</th>
                <th>Donn&eacute;es</th>
                <th>Base l&eacute;gale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gestion du compte utilisateur</td>
                <td>E-mail, nom, entreprise, secteurs d&apos;activit&eacute;</td>
                <td>Ex&eacute;cution du contrat (art. 6.1.b RGPD)</td>
              </tr>
              <tr>
                <td>Analyse IA des documents (DCE)</td>
                <td>Documents t&eacute;l&eacute;vers&eacute;s, profil entreprise</td>
                <td>Ex&eacute;cution du contrat (art. 6.1.b RGPD)</td>
              </tr>
              <tr>
                <td>Suivi des erreurs (Sentry)</td>
                <td>Donn&eacute;es techniques (IP, navigateur, erreurs)</td>
                <td>Consentement (art. 6.1.a RGPD)</td>
              </tr>
              <tr>
                <td>Analytiques (Plausible)</td>
                <td>Donn&eacute;es agr&eacute;g&eacute;es anonymes</td>
                <td>Int&eacute;r&ecirc;t l&eacute;gitime (art. 6.1.f RGPD)</td>
              </tr>
            </tbody>
          </table>

          <h2>3. Destinataires des donn&eacute;es</h2>
          <p>Vos donn&eacute;es peuvent &ecirc;tre transmises aux sous-traitants suivants :</p>
          <ul>
            <li><strong>Anthropic</strong> (Claude AI) &mdash; Analyse documentaire IA, San Francisco, USA</li>
            <li><strong>Google</strong> (Gemini AI) &mdash; G&eacute;n&eacute;ration de contenu IA, Mountain View, USA</li>
            <li><strong>NVIDIA</strong> (Llama AI via NIM) &mdash; Analyse IA de secours, Santa Clara, USA</li>
            <li><strong>Sentry</strong> &mdash; Suivi des erreurs applicatives, San Francisco, USA</li>
            <li><strong>Plausible Analytics</strong> &mdash; Analytiques web respectueuses de la vie priv&eacute;e (sans cookies), UE</li>
            <li><strong>Vercel</strong> &mdash; H&eacute;bergement et d&eacute;ploiement, San Francisco, USA</li>
            <li><strong>Cloudflare</strong> (R2) &mdash; Stockage de fichiers, San Francisco, USA</li>
          </ul>

          <h2>4. Transferts internationaux</h2>
          <p>
            Certains sous-traitants sont situ&eacute;s aux &Eacute;tats-Unis. Ces transferts sont encadr&eacute;s par le
            EU-US Data Privacy Framework (d&eacute;cision d&apos;ad&eacute;quation de la Commission europ&eacute;enne du 10 juillet 2023)
            et/ou par des clauses contractuelles types approuv&eacute;es par la Commission europ&eacute;enne.
          </p>

          <h2>5. Dur&eacute;e de conservation</h2>
          <ul>
            <li><strong>Donn&eacute;es de compte</strong> : dur&eacute;e du contrat + 3 ans apr&egrave;s la derni&egrave;re activit&eacute;</li>
            <li><strong>Documents t&eacute;l&eacute;vers&eacute;s (DCE)</strong> : dur&eacute;e du contrat, supprim&eacute;s &agrave; la cl&ocirc;ture du compte</li>
            <li><strong>Logs techniques</strong> : 12 mois</li>
            <li><strong>Donn&eacute;es de facturation</strong> : 10 ans (obligation l&eacute;gale)</li>
          </ul>

          <h2>6. Vos droits</h2>
          <p>
            Conform&eacute;ment au RGPD, vous disposez des droits suivants sur vos donn&eacute;es personnelles :
          </p>
          <ul>
            <li><strong>Droit d&apos;acc&egrave;s</strong> (art. 15 RGPD)</li>
            <li><strong>Droit de rectification</strong> (art. 16 RGPD)</li>
            <li><strong>Droit &agrave; l&apos;effacement</strong> (art. 17 RGPD)</li>
            <li><strong>Droit &agrave; la portabilit&eacute;</strong> (art. 20 RGPD)</li>
            <li><strong>Droit d&apos;opposition</strong> (art. 21 RGPD)</li>
            <li><strong>Droit &agrave; la limitation du traitement</strong> (art. 18 RGPD)</li>
          </ul>
          <p>
            Pour exercer vos droits, contactez-nous &agrave; <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>.
            Nous r&eacute;pondrons dans un d&eacute;lai d&apos;un mois maximum.
          </p>
          <p>
            Vous avez &eacute;galement le droit d&apos;introduire une r&eacute;clamation aupr&egrave;s de la
            <strong> Commission Nationale de l&apos;Informatique et des Libert&eacute;s (CNIL)</strong> :
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer"> www.cnil.fr</a>.
          </p>

          <h2>7. Cookies</h2>
          <p>
            Le site lefilonao.com utilise uniquement :
          </p>
          <ul>
            <li>
              <strong>Cookies essentiels</strong> &mdash; N&eacute;cessaires au fonctionnement du site
              (authentification, pr&eacute;f&eacute;rences). Exempt&eacute;s de consentement conform&eacute;ment &agrave; l&apos;article 82
              de la loi Informatique et Libert&eacute;s.
            </li>
            <li>
              <strong>Sentry (suivi d&apos;erreurs)</strong> &mdash; D&eacute;pos&eacute; uniquement avec votre consentement.
              Permet de d&eacute;tecter et corriger les erreurs techniques.
            </li>
            <li>
              <strong>Plausible Analytics</strong> &mdash; Solution sans cookie, respectueuse de la vie priv&eacute;e.
              Ne n&eacute;cessite pas de consentement (recommandation CNIL).
            </li>
          </ul>
          <p>
            Vous pouvez g&eacute;rer vos pr&eacute;f&eacute;rences de cookies &agrave; tout moment via le lien
            &laquo; G&eacute;rer les cookies &raquo; en bas de chaque page.
          </p>

          <h2>8. Transparence IA (EU AI Act, art. 50)</h2>
          <p>
            Le Filon AO utilise des syst&egrave;mes d&apos;intelligence artificielle pour :
          </p>
          <ul>
            <li>Scorer les appels d&apos;offres (Go / Maybe / Pass) selon votre profil d&apos;activit&eacute;</li>
            <li>Analyser les Dossiers de Consultation des Entreprises (DCE)</li>
            <li>G&eacute;n&eacute;rer des brouillons de m&eacute;moire technique</li>
            <li>Fournir des suggestions d&apos;am&eacute;lioration via le Coach IA</li>
          </ul>
          <p>
            Ces r&eacute;sultats sont fournis &agrave; titre indicatif et ne constituent en aucun cas un conseil juridique
            ou une garantie de succ&egrave;s. L&apos;utilisateur reste seul responsable de ses d&eacute;cisions
            et de la v&eacute;rification du contenu g&eacute;n&eacute;r&eacute;.
          </p>
          <p>
            Fournisseurs IA utilis&eacute;s : Anthropic (Claude), Google (Gemini), NVIDIA (Llama).
            Aucune donn&eacute;e utilisateur n&apos;est utilis&eacute;e pour entra&icirc;ner ces mod&egrave;les.
          </p>

          <h2>9. Modifications</h2>
          <p>
            Nous nous r&eacute;servons le droit de modifier cette politique de confidentialit&eacute; &agrave; tout moment.
            Les modifications seront publi&eacute;es sur cette page avec la date de mise &agrave; jour.
          </p>
        </div>
      </article>
    </main>
  );
}
