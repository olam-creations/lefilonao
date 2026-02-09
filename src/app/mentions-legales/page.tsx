import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions l\u00e9gales | Le Filon AO',
  description: 'Mentions l\u00e9gales du site lefilonao.com - Veille march\u00e9s publics par IA.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <article className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors mb-8 inline-block">&larr; Retour &agrave; l&apos;accueil</Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Mentions l&eacute;gales</h1>
        <p className="text-sm text-slate-400 mb-10">Derni&egrave;re mise &agrave; jour : 9 f&eacute;vrier 2026</p>

        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600">
          <h2>&Eacute;diteur du site</h2>
          <p>
            Le site <strong>lefilonao.com</strong> est &eacute;dit&eacute; par :<br />
            <strong>Olam Creations</strong><br />
            Forme juridique : Micro-entreprise (Entreprise Individuelle)<br />
            Si&egrave;ge social : [ADRESSE DE DOMICILIATION &mdash; LegalPlace en cours]<br />
            SIRET : 909 935 892 000 10<br />
            Code NAF : 6201Z &mdash; Programmation informatique
          </p>

          <h2>Directeur de la publication</h2>
          <p>Jonas Kleinschmidt</p>

          <h2>Contact</h2>
          <p>E-mail : <a href="mailto:contact@lefilonao.com">contact@lefilonao.com</a></p>

          <h2>H&eacute;bergement</h2>
          <p>
            Le site est h&eacute;berg&eacute; par :<br />
            <strong>Vercel Inc.</strong><br />
            340 S Lemon Ave #4133, Walnut, CA 91789, &Eacute;tats-Unis<br />
            Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
          </p>
          <p>
            Stockage de fichiers :<br />
            <strong>Cloudflare, Inc.</strong><br />
            101 Townsend St, San Francisco, CA 94107, &Eacute;tats-Unis<br />
            Site web : <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">cloudflare.com</a>
          </p>

          <h2>Protection des donn&eacute;es personnelles</h2>
          <p>
            Conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD) et &agrave; la loi
            Informatique et Libert&eacute;s du 6 janvier 1978 modifi&eacute;e, vous disposez de droits sur vos donn&eacute;es personnelles.
            Consultez notre <Link href="/politique-confidentialite">politique de confidentialit&eacute;</Link> pour plus d&apos;informations.
          </p>

          <h2>Propri&eacute;t&eacute; intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus pr&eacute;sents sur le site lefilonao.com (textes, images, logos, logiciels, base de donn&eacute;es,
            algorithmes, interfaces) est prot&eacute;g&eacute; par les lois fran&ccedil;aises et internationales relatives &agrave; la
            propri&eacute;t&eacute; intellectuelle. Toute reproduction, repr&eacute;sentation ou diffusion, totale ou partielle,
            sans autorisation &eacute;crite pr&eacute;alable, est interdite et constitue une contrefa&ccedil;on sanctionn&eacute;e par les
            articles L.335-2 et suivants du Code de la propri&eacute;t&eacute; intellectuelle.
          </p>

          <h2>Cr&eacute;dits</h2>
          <p>&copy; 2026 Le Filon AO. Tous droits r&eacute;serv&eacute;s.</p>
        </div>
      </article>
    </main>
  );
}
