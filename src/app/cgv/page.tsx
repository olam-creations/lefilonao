import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions g\u00e9n\u00e9rales de vente | Le Filon AO',
  description: 'Conditions g\u00e9n\u00e9rales de vente du service Le Filon AO - Abonnements et tarifs.',
  alternates: { canonical: '/cgv' },
};

export default function CgvPage() {
  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <article className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors mb-8 inline-block">&larr; Retour &agrave; l&apos;accueil</Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Conditions g&eacute;n&eacute;rales de vente</h1>
        <p className="text-sm text-slate-400 mb-10">Derni&egrave;re mise &agrave; jour : 9 f&eacute;vrier 2026</p>

        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600">
          <h2>1. Objet</h2>
          <p>
            Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales de Vente (ci-apr&egrave;s &laquo; CGV &raquo;) r&eacute;gissent
            les conditions de souscription et d&apos;utilisation des offres payantes du service Le Filon AO,
            &eacute;dit&eacute; par <strong>Olam Creations</strong> (Jonas Kleinschmidt),
            micro-entreprise (EI),
            si&egrave;ge social : [ADRESSE DE DOMICILIATION &mdash; LegalPlace en cours],
            SIRET : 909 935 892 000 10.
          </p>

          <h2>2. Offres et tarifs</h2>
          <h3>Offre Gratuite</h3>
          <ul>
            <li>Prix : 0 &euro;</li>
            <li>5 appels d&apos;offres consultables par mois</li>
            <li>Score Go/No-Go par IA</li>
            <li>Acc&egrave;s au tableau de bord</li>
          </ul>
          <h3>Offre Pro</h3>
          <ul>
            <li>Prix : 30 &euro; HT / mois (36 &euro; TTC au taux de TVA en vigueur)</li>
            <li>Appels d&apos;offres illimit&eacute;s</li>
            <li>Analyse DCE par IA</li>
            <li>Aide &agrave; la r&eacute;daction de m&eacute;moires techniques</li>
            <li>Intelligence de march&eacute;</li>
            <li>Alertes quotidiennes personnalis&eacute;es</li>
            <li>Coach IA</li>
          </ul>

          <h2>3. Modalit&eacute;s de paiement</h2>
          <p>
            Le paiement s&apos;effectue par carte bancaire via la plateforme s&eacute;curis&eacute;e <strong>Stripe</strong>.
            Le paiement est exigible imm&eacute;diatement &agrave; la souscription. Les prix sont indiqu&eacute;s en euros
            hors taxes (HT) et toutes taxes comprises (TTC).
          </p>

          <h2>4. Dur&eacute;e et renouvellement</h2>
          <p>
            L&apos;abonnement Pro est souscrit pour une dur&eacute;e d&apos;un mois. Il est renouvel&eacute; automatiquement
            par tacite reconduction &agrave; chaque &eacute;ch&eacute;ance mensuelle, sauf r&eacute;siliation par l&apos;Utilisateur.
          </p>

          <h2>5. R&eacute;siliation</h2>
          <p>
            L&apos;Utilisateur peut r&eacute;silier son abonnement Pro &agrave; tout moment depuis son espace client.
            La r&eacute;siliation prend effet &agrave; la fin de la p&eacute;riode mensuelle en cours. Aucun remboursement
            au prorata ne sera effectu&eacute; pour la p&eacute;riode entam&eacute;e.
          </p>
          <p>
            L&apos;acc&egrave;s aux fonctionnalit&eacute;s Pro est maintenu jusqu&apos;&agrave; la fin de la p&eacute;riode pay&eacute;e.
            Apr&egrave;s cette date, le compte repasse automatiquement sur l&apos;offre Gratuite.
          </p>

          <h2>6. Droit de r&eacute;tractation</h2>
          <p>
            <strong>Clients professionnels (B2B) :</strong> conform&eacute;ment &agrave; l&apos;article L.221-3 du Code de la
            consommation, le droit de r&eacute;tractation ne s&apos;applique pas aux contrats conclus entre professionnels.
          </p>
          <p>
            <strong>Consommateurs :</strong> si vous agissez en qualit&eacute; de consommateur, vous disposez d&apos;un d&eacute;lai
            de 14 jours &agrave; compter de la souscription pour exercer votre droit de r&eacute;tractation, conform&eacute;ment
            &agrave; l&apos;article L.221-18 du Code de la consommation. Toutefois, en acc&eacute;dant au Service avant la fin
            de ce d&eacute;lai, vous reconnaissez renoncer express&eacute;ment &agrave; votre droit de r&eacute;tractation
            conform&eacute;ment &agrave; l&apos;article L.221-28.
          </p>

          <h2>7. Niveau de service (SLA)</h2>
          <p>
            La Soci&eacute;t&eacute; s&apos;engage &agrave; mettre en &oelig;uvre les moyens n&eacute;cessaires pour assurer la
            disponibilit&eacute; du Service avec un objectif de <strong>99 % de disponibilit&eacute;</strong> (hors maintenance
            programm&eacute;e et cas de force majeure). Cet engagement est un objectif de moyens, non de r&eacute;sultat.
          </p>

          <h2>8. Garanties et responsabilit&eacute;</h2>
          <p>
            Le Service est fourni &laquo; en l&apos;&eacute;tat &raquo;. Les r&eacute;sultats g&eacute;n&eacute;r&eacute;s par l&apos;IA
            sont indicatifs et ne se substituent pas &agrave; l&apos;expertise professionnelle de l&apos;Utilisateur.
          </p>
          <p>
            La responsabilit&eacute; de la Soci&eacute;t&eacute; est limit&eacute;e au montant des sommes vers&eacute;es par
            l&apos;Utilisateur au cours des 12 derniers mois. La Soci&eacute;t&eacute; ne saurait &ecirc;tre tenue responsable
            des dommages indirects (perte de march&eacute;, perte de chiffre d&apos;affaires, perte de donn&eacute;es).
          </p>

          <h2>9. Force majeure</h2>
          <p>
            La Soci&eacute;t&eacute; est exon&eacute;r&eacute;e de toute responsabilit&eacute; en cas de force majeure au sens
            de l&apos;article 1218 du Code civil, incluant notamment : panne d&apos;infrastructure cloud, cyberattaque,
            d&eacute;cision gouvernementale, catastrophe naturelle.
          </p>

          <h2>10. Loi applicable</h2>
          <p>
            Les pr&eacute;sentes CGV sont r&eacute;gies par le droit fran&ccedil;ais. En cas de litige,
            les parties s&apos;engagent &agrave; rechercher une solution amiable. &Agrave; d&eacute;faut,
            les tribunaux comp&eacute;tents de Paris seront seuls comp&eacute;tents.
          </p>

          <h2>11. Contact</h2>
          <p>
            Pour toute question relative aux pr&eacute;sentes CGV :{' '}
            <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>
          </p>
        </div>
      </article>
    </main>
  );
}
