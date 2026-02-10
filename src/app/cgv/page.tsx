import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Conditions générales de vente | Le Filon AO',
  description: 'Conditions générales de vente du service Le Filon AO - Abonnements et tarifs.',
  alternates: { canonical: '/cgv' },
};

export default function CgvPage() {
  return (
    <LegalShell title="Conditions générales de vente" updatedAt="10 février 2026" currentPath="/cgv">
      <h2>1. Objet</h2>
      <p>
        Les présentes CGV régissent les conditions de souscription et d&apos;utilisation des offres
        payantes du service Le Filon AO, un <strong>projet personnel</strong> édité par Jonas Kleinschmidt,
        sous le nom commercial <strong>Olam Creations</strong> (micro-entreprise, SIRET 909 935 892 000 10),
        domicilié 60 rue François 1er, 75008 Paris (LegalPlace).
      </p>

      <h2>2. Offres et tarifs</h2>

      <h3>Offre Gratuite</h3>
      <ul>
        <li>Prix : 0 €</li>
        <li>5 appels d&apos;offres consultables par mois</li>
        <li>Score Go/No-Go par IA</li>
        <li>Accès au tableau de bord</li>
      </ul>

      <h3>Offre Pro</h3>
      <ul>
        <li>Prix : <strong>50 € TTC / mois</strong> (41,67 € HT au taux de TVA de 20 %)</li>
        <li>Appels d&apos;offres illimités</li>
        <li>Analyse DCE par IA</li>
        <li>Aide à la rédaction de mémoires techniques</li>
        <li>Intelligence de marché</li>
        <li>Alertes quotidiennes personnalisées</li>
        <li>Watchlist acheteurs — surveillance des comptes clés</li>
        <li>Coach IA</li>
      </ul>

      <h3>Offre Fondateur (places limitées)</h3>
      <ul>
        <li>Prix : <strong>25 € TTC / mois pendant 6 mois</strong> à compter de la date de souscription</li>
        <li>À l&apos;issue de la période fondateur : <strong>40 € TTC / mois</strong> (tarif fidélité permanent, soit -20 % par rapport au tarif normal)</li>
        <li>Fonctionnalités identiques à l&apos;offre Pro</li>
        <li>Offre réservée aux premiers utilisateurs, dans la limite des places disponibles</li>
      </ul>

      <h2>3. Modalités de paiement</h2>
      <p>
        Le paiement s&apos;effectue par carte bancaire via <strong>Stripe</strong>.
        Le paiement est exigible immédiatement à la souscription.
        Tous les prix affichés s&apos;entendent toutes taxes comprises (TTC).
        Le taux de TVA applicable est de 20 %.
      </p>

      <h2>4. Durée et renouvellement</h2>
      <p>
        L&apos;abonnement est souscrit pour une durée d&apos;un mois, renouvelé automatiquement
        par tacite reconduction, sauf résiliation par l&apos;Utilisateur.
      </p>

      <h2>5. Résiliation</h2>
      <p>
        L&apos;Utilisateur peut résilier à tout moment depuis son espace client ou par e-mail.
        La résiliation prend effet à la fin de la période mensuelle en cours.
        Aucun remboursement au prorata. Après résiliation, le compte repasse sur l&apos;offre Gratuite.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        <strong>Professionnels (B2B) :</strong> le droit de rétractation ne s&apos;applique pas
        (art. L.221-3 du Code de la consommation).
      </p>
      <p>
        <strong>Consommateurs :</strong> délai de 14 jours (art. L.221-18). En accédant au Service
        avant la fin de ce délai, vous renoncez expressément à votre droit de rétractation (art. L.221-28).
      </p>

      <h2>7. Niveau de service</h2>
      <p>
        L&apos;Éditeur s&apos;engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité
        du Service avec un objectif de <strong>99 %</strong> (hors maintenance et force majeure).
        S&apos;agissant d&apos;un projet personnel, cet engagement est un objectif de moyens, non de résultat.
      </p>

      <h2>8. Garanties et responsabilité</h2>
      <p>
        Le Service est fourni « en l&apos;état ». Les résultats générés par l&apos;IA sont indicatifs
        et ne se substituent pas à l&apos;expertise professionnelle de l&apos;Utilisateur.
      </p>
      <p>
        La responsabilité de l&apos;Éditeur est limitée au montant des sommes versées par l&apos;Utilisateur
        au cours des 12 derniers mois. L&apos;Éditeur ne saurait être tenu responsable des dommages indirects.
      </p>

      <h2>9. Force majeure</h2>
      <p>
        L&apos;Éditeur est exonéré de toute responsabilité en cas de force majeure (art. 1218 du Code civil) :
        panne d&apos;infrastructure cloud, cyberattaque, décision gouvernementale, catastrophe naturelle.
      </p>

      <h2>10. Loi applicable</h2>
      <p>
        Les présentes CGV sont régies par le droit français. En cas de litige,
        recherche d&apos;une solution amiable prioritaire. À défaut, tribunaux compétents de Paris.
      </p>

      <h2>11. Contact</h2>
      <p>
        <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a>
      </p>
    </LegalShell>
  );
}
