'use client';

import { Check, Zap, Building2, Crown } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    period: '/mois',
    yearlyPrice: '348€/an',
    description: 'Pour démarrer sur les marchés publics',
    icon: Zap,
    features: [
      'Appels d\'offres illimités',
      'Alertes quotidiennes',
      'Score Go/No-Go',
      'Accès BOAMP complet',
      'Historique 30 jours',
    ],
    cta: 'Essai gratuit 14 jours',
    href: '/subscribe?plan=starter',
    popular: false,
    savings: '4x moins cher que la concurrence',
  },
  {
    name: 'Pro',
    price: 79,
    period: '/mois',
    yearlyPrice: '948€/an',
    description: 'Pour les entreprises actives',
    icon: Building2,
    features: [
      'Tout Starter +',
      'Alertes temps réel',
      'BOAMP + TED + sources régionales',
      'Analyse IA détaillée',
      'Export Excel/CSV',
      'Support prioritaire',
    ],
    cta: 'Essai gratuit 14 jours',
    href: '/subscribe?plan=pro',
    popular: true,
    savings: '2x moins cher que la concurrence',
  },
  {
    name: 'Business',
    price: 199,
    period: '/mois',
    yearlyPrice: '2 388€/an',
    description: 'Pour les équipes et grandes structures',
    icon: Crown,
    features: [
      'Tout Pro +',
      'Accès API',
      'Multi-utilisateurs (5 inclus)',
      'Account manager dédié',
      'Intégration CRM',
      'SLA 99.9%',
    ],
    cta: 'Nous contacter',
    href: 'mailto:contact@lefilonao.com?subject=Offre%20Business',
    popular: false,
    savings: null,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            <span className="text-yellow-500">Le Filon</span> AO
          </Link>
          <Link 
            href="/subscribe" 
            className="px-4 py-2 bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
          >
            S'inscrire
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Tarifs <span className="text-yellow-500">simples</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          Commencez gratuitement. Passez à Pro quand vous êtes prêt.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative border p-8 ${
                plan.popular
                  ? 'border-yellow-500 bg-neutral-900'
                  : 'border-neutral-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-sm font-bold">
                  POPULAIRE
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-yellow-500' : 'text-neutral-400'}`} />
                <h2 className="text-xl font-bold">{plan.name}</h2>
              </div>
              
              <div className="mb-2">
                <span className="text-4xl font-black">{plan.price}€</span>
                <span className="text-neutral-500">{plan.period}</span>
              </div>
              <p className="text-sm text-neutral-500 mb-2">{plan.yearlyPrice}</p>
              {plan.savings && (
                <p className="text-sm text-green-500 font-medium mb-2">✓ {plan.savings}</p>
              )}
              
              <p className="text-neutral-400 mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href={plan.href}
                className={`block w-full p-4 text-center font-bold transition-colors ${
                  plan.popular
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-neutral-800 mt-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Questions fréquentes</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-2">Comment ça marche ?</h3>
              <p className="text-neutral-400">
                On scanne le BOAMP et les sources officielles toutes les heures. 
                Quand un appel d'offres correspond à votre profil, vous recevez une alerte 
                avec un score Go/No-Go pour vous aider à décider rapidement.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Puis-je annuler à tout moment ?</h3>
              <p className="text-neutral-400">
                Oui, sans engagement. Vous pouvez annuler votre abonnement Pro ou Enterprise 
                à tout moment depuis votre espace client.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Quelles sources couvrez-vous ?</h3>
              <p className="text-neutral-400">
                BOAMP (Bulletin Officiel), TED Europa (marchés européens), et plusieurs 
                plateformes régionales. Nous ajoutons régulièrement de nouvelles sources.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Comment fonctionne le score Go/No-Go ?</h3>
              <p className="text-neutral-400">
                Notre IA analyse l'appel d'offres selon 5 critères : éligibilité, alignement 
                avec votre profil, rentabilité potentielle, niveau de concurrence, et délais. 
                Score ≥70 = GO, 40-69 = À ÉTUDIER, &lt;40 = PASSER.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500">© 2026 Le Filon AO — Metatron Labs</p>
          <div className="flex gap-6 text-neutral-500">
            <Link href="/subscribe" className="hover:text-white">S'inscrire</Link>
            <a href="mailto:contact@lefilonao.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
