'use client';

import { Check, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// CONFIG: Prix unique
const PRICE = 50; // €/mois

const FEATURES = [
  'Appels d\'offres illimités',
  'Alertes quotidiennes par email',
  'Score Go/No-Go pour chaque AO',
  'Accès BOAMP complet',
  'Analyse IA détaillée',
  'Export Excel/CSV',
  'Support par email',
];

const COMPETITOR_PRICES = [
  { name: 'MPFrance', price: '1 450 - 4 000€/an' },
  { name: 'Klekoon', price: '~1 500€/an' },
  { name: 'Vecteur Plus', price: '~2 000€/an' },
];

export default function PricingPage() {
  const yearlyPrice = PRICE * 12;
  const savings = Math.round((1 - yearlyPrice / 1500) * 100); // vs moyenne concurrence

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            <span className="text-yellow-500">Le Filon</span> AO
          </Link>
          <Link 
            href="/subscribe" 
            className="px-4 py-2 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
          >
            Commencer
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-6">
          Un prix. <span className="text-yellow-500">Tout inclus.</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-xl mx-auto">
          Pas de tiers compliqués. Pas de features cachées.
          Tout ce dont vous avez besoin pour gagner des marchés.
        </p>
      </section>

      {/* Single Pricing Card */}
      <section className="py-8 px-6">
        <div className="max-w-lg mx-auto">
          <div className="border-2 border-yellow-500 bg-neutral-900 p-10">
            {/* Price */}
            <div className="text-center mb-8">
              <div className="inline-block px-3 py-1 bg-yellow-500 text-black text-sm font-bold mb-4">
                ESSAI GRATUIT 14 JOURS
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black">{PRICE}€</span>
                <span className="text-xl text-neutral-400">/mois</span>
              </div>
              <p className="text-neutral-500 mt-2">{yearlyPrice}€/an • Sans engagement</p>
              <p className="text-green-500 font-bold mt-2">
                {savings}% moins cher que la concurrence
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-10">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-lg">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/subscribe"
              className="flex items-center justify-center gap-2 w-full p-5 bg-yellow-500 text-black text-xl font-bold hover:bg-yellow-400 transition-colors"
            >
              Démarrer l'essai gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-center text-neutral-500 text-sm mt-4">
              Carte bancaire requise • Annulation facile
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Comparez avec la concurrence
          </h2>
          
          <div className="border border-neutral-800">
            {/* Le Filon row */}
            <div className="flex justify-between items-center p-4 bg-yellow-500/10 border-b border-neutral-800">
              <span className="font-bold text-yellow-500">Le Filon AO</span>
              <span className="font-black text-xl">{yearlyPrice}€/an</span>
            </div>
            
            {/* Competitors */}
            {COMPETITOR_PRICES.map((comp) => (
              <div key={comp.name} className="flex justify-between items-center p-4 border-b border-neutral-800 last:border-b-0">
                <span className="text-neutral-400">{comp.name}</span>
                <span className="text-neutral-500">{comp.price}</span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-neutral-500 mt-6">
            Même fonctionnalités. Prix divisé par 3.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Questions fréquentes</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-2">Comment fonctionne l'essai gratuit ?</h3>
              <p className="text-neutral-400">
                Vous avez accès à toutes les fonctionnalités pendant 14 jours.
                Aucun prélèvement avant la fin de l'essai. Annulez en un clic.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Quelles sources couvrez-vous ?</h3>
              <p className="text-neutral-400">
                BOAMP (Bulletin Officiel des Annonces de Marchés Publics) et 
                bientôt TED Europa pour les marchés européens.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Comment fonctionne le score Go/No-Go ?</h3>
              <p className="text-neutral-400">
                Notre IA analyse chaque appel d'offres selon votre profil et 5 critères : 
                éligibilité, alignement, rentabilité, concurrence, et délais.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Puis-je annuler à tout moment ?</h3>
              <p className="text-neutral-400">
                Oui, sans engagement. Annulez depuis votre espace ou par simple email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-yellow-500">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-black mb-4">
            Prêt à trouver votre prochain marché ?
          </h2>
          <p className="text-black/70 mb-8">
            Rejoignez les entreprises qui gagnent des AO avec Le Filon.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold text-lg hover:bg-neutral-900 transition-colors"
          >
            Démarrer l'essai gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 px-6 bg-black">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500">© 2026 Le Filon AO — Metatron Labs</p>
          <div className="flex gap-6 text-neutral-500">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <Link href="/subscribe" className="hover:text-white">S'inscrire</Link>
            <a href="mailto:contact@lefilonao.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
