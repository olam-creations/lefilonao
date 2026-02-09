import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions g\u00e9n\u00e9rales d\u0027utilisation | Le Filon AO',
  description: 'Conditions g\u00e9n\u00e9rales d\u0027utilisation du service Le Filon AO - Veille march\u00e9s publics par IA.',
  alternates: { canonical: '/cgu' },
};

export default function CguPage() {
  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <article className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors mb-8 inline-block">&larr; Retour &agrave; l&apos;accueil</Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Conditions g&eacute;n&eacute;rales d&apos;utilisation</h1>
        <p className="text-sm text-slate-400 mb-10">Derni&egrave;re mise &agrave; jour : 9 f&eacute;vrier 2026</p>

        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600">
          <h2>1. Objet</h2>
          <p>
            Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation (ci-apr&egrave;s &laquo; CGU &raquo;) r&eacute;gissent
            l&apos;acc&egrave;s et l&apos;utilisation du service Le Filon AO, accessible &agrave; l&apos;adresse
            <a href="https://lefilonao.com"> lefilonao.com</a>, &eacute;dit&eacute; par <strong>Olam Creations</strong> (Jonas Kleinschmidt, micro-entreprise, SIRET 909 935 892 000 10).
          </p>
          <p>
            L&apos;inscription au service implique l&apos;acceptation pleine et enti&egrave;re des pr&eacute;sentes CGU.
          </p>

          <h2>2. D&eacute;finitions</h2>
          <ul>
            <li><strong>&laquo; Service &raquo;</strong> : la plateforme Le Filon AO et l&apos;ensemble de ses fonctionnalit&eacute;s.</li>
            <li><strong>&laquo; Utilisateur &raquo;</strong> : toute personne physique ou morale inscrite au Service.</li>
            <li><strong>&laquo; &Eacute;diteur &raquo;</strong> : Olam Creations, Jonas Kleinschmidt, &eacute;diteur du Service.</li>
            <li><strong>&laquo; AO &raquo;</strong> : Appel d&apos;Offres publi&eacute; dans le cadre de la commande publique.</li>
            <li><strong>&laquo; DCE &raquo;</strong> : Dossier de Consultation des Entreprises.</li>
          </ul>

          <h2>3. Inscription et compte</h2>
          <p>
            L&apos;acc&egrave;s au Service n&eacute;cessite la cr&eacute;ation d&apos;un compte. L&apos;Utilisateur s&apos;engage &agrave;
            fournir des informations exactes et &agrave; les maintenir &agrave; jour. L&apos;Utilisateur est responsable de la
            confidentialit&eacute; de ses identifiants de connexion.
          </p>

          <h2>4. Description du service</h2>
          <p>Le Filon AO propose les fonctionnalit&eacute;s suivantes :</p>
          <ul>
            <li>Veille automatis&eacute;e sur les march&eacute;s publics (source : BOAMP)</li>
            <li>Scoring IA Go/No-Go des appels d&apos;offres selon le profil de l&apos;Utilisateur</li>
            <li>Analyse automatis&eacute;e des DCE par intelligence artificielle</li>
            <li>Aide &agrave; la r&eacute;daction de m&eacute;moires techniques</li>
            <li>Intelligence de march&eacute; et donn&eacute;es concurrentielles</li>
          </ul>

          <h2>5. Obligations de l&apos;Utilisateur</h2>
          <p>L&apos;Utilisateur s&apos;engage &agrave; :</p>
          <ul>
            <li>Utiliser le Service conform&eacute;ment &agrave; sa destination professionnelle</li>
            <li>Ne pas tenter d&apos;acc&eacute;der &agrave; des donn&eacute;es non autoris&eacute;es</li>
            <li>Ne pas perturber le fonctionnement du Service</li>
            <li>Respecter les droits de propri&eacute;t&eacute; intellectuelle</li>
          </ul>

          <h2>6. Utilisations interdites</h2>
          <p>Il est strictement interdit de :</p>
          <ul>
            <li>Utiliser le Service &agrave; des fins ill&eacute;gales ou frauduleuses</li>
            <li>Scraper, copier ou extraire syst&eacute;matiquement les donn&eacute;es du Service</li>
            <li>Revendre ou redistribuer le contenu g&eacute;n&eacute;r&eacute; par l&apos;IA sans v&eacute;rification pr&eacute;alable</li>
            <li>Usurper l&apos;identit&eacute; d&apos;un tiers</li>
            <li>Partager ses identifiants de connexion avec des tiers</li>
          </ul>

          <h2>7. Propri&eacute;t&eacute; intellectuelle</h2>
          <p>
            Le Service, incluant sa structure, son code source, ses algorithmes, son interface et ses contenus
            &eacute;ditoriaux, est prot&eacute;g&eacute; par le droit de la propri&eacute;t&eacute; intellectuelle.
            L&apos;Utilisateur conserve la propri&eacute;t&eacute; de ses donn&eacute;es et documents t&eacute;l&eacute;vers&eacute;s.
          </p>

          <h2>8. Responsabilit&eacute; et limitations</h2>
          <p>
            <strong>Les r&eacute;sultats de l&apos;IA sont fournis &agrave; titre indicatif uniquement.</strong> Ils ne constituent
            pas un conseil juridique, financier ou professionnel. L&apos;Utilisateur reste seul responsable de ses
            d&eacute;cisions, de la v&eacute;rification du contenu g&eacute;n&eacute;r&eacute; et de la conformit&eacute; de ses
            r&eacute;ponses aux appels d&apos;offres.
          </p>
          <p>
            La Soci&eacute;t&eacute; s&apos;efforce d&apos;assurer la disponibilit&eacute; du Service mais ne garantit pas un acc&egrave;s
            ininterrompu. La Soci&eacute;t&eacute; ne saurait &ecirc;tre tenue responsable des dommages indirects
            r&eacute;sultant de l&apos;utilisation du Service.
          </p>

          <h2>9. Donn&eacute;es personnelles</h2>
          <p>
            Le traitement des donn&eacute;es personnelles est d&eacute;crit dans notre{' '}
            <Link href="/politique-confidentialite">politique de confidentialit&eacute;</Link>.
          </p>

          <h2>10. Suspension et r&eacute;siliation</h2>
          <p>
            La Soci&eacute;t&eacute; se r&eacute;serve le droit de suspendre ou r&eacute;silier l&apos;acc&egrave;s d&apos;un Utilisateur
            en cas de violation des pr&eacute;sentes CGU, sans pr&eacute;avis ni indemnit&eacute;.
            L&apos;Utilisateur peut supprimer son compte &agrave; tout moment depuis son espace client.
          </p>

          <h2>11. Modification des CGU</h2>
          <p>
            La Soci&eacute;t&eacute; peut modifier les pr&eacute;sentes CGU &agrave; tout moment. Les Utilisateurs seront inform&eacute;s
            des modifications par e-mail ou par notification sur le Service. La poursuite de l&apos;utilisation du Service
            apr&egrave;s modification vaut acceptation des nouvelles CGU.
          </p>

          <h2>12. Loi applicable et juridiction</h2>
          <p>
            Les pr&eacute;sentes CGU sont r&eacute;gies par le droit fran&ccedil;ais. En cas de litige,
            les parties s&apos;engagent &agrave; rechercher une solution amiable. &Agrave; d&eacute;faut,
            les tribunaux comp&eacute;tents de Paris seront seuls comp&eacute;tents.
          </p>

          <h2>13. Contact</h2>
          <p>
            Pour toute question relative aux pr&eacute;sentes CGU :{' '}
            <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>
          </p>
        </div>
      </article>
    </main>
  );
}
