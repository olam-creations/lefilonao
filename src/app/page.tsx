'use client';

import Link from 'next/link';
import { ArrowRight, Search, Zap, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            <span className="text-yellow-500">Le Filon</span> AO
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/#how" className="text-neutral-400 hover:text-white transition-colors hidden md:block">
              Comment ça marche
            </Link>
            <Link href="/pricing" className="text-neutral-400 hover:text-white transition-colors">
              Tarifs
            </Link>
            <Link href="/subscribe" className="text-neutral-400 hover:text-white transition-colors">
              S'inscrire
            </Link>
            <Link 
              href="/pricing" 
              className="px-4 py-2 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
            >
              Essai gratuit →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm font-medium mb-8">
            🎯 3x moins cher que la concurrence
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Les appels d'offres<br/>
            <span className="text-yellow-500">faits pour vous</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-2xl mx-auto">
            On scanne le BOAMP 24/7. Vous recevez uniquement les marchés publics 
            qui matchent votre expertise, avec un score Go/No-Go.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/pricing"
              className="px-8 py-4 bg-yellow-500 text-black font-bold text-lg flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
            >
              Voir les tarifs <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/subscribe"
              className="px-8 py-4 border border-neutral-700 font-bold text-lg hover:border-white transition-colors"
            >
              Essai gratuit 14 jours
            </Link>
          </div>
          
          <p className="text-neutral-500 text-sm">
            Sans engagement · Annulable à tout moment · Support réactif
          </p>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20 px-6 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Problem */}
            <div>
              <div className="flex items-center gap-2 text-red-500 mb-4">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold uppercase text-sm">Le problème</span>
              </div>
              <h2 className="text-3xl font-bold mb-6">Vous perdez des heures sur le BOAMP</h2>
              <ul className="space-y-4 text-neutral-400">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Des centaines d'AO à trier chaque semaine</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Impossible de savoir lesquels valent le coup</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Vous ratez des opportunités faute de temps</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Les outils existants coûtent 1500-4000€/an</span>
                </li>
              </ul>
            </div>
            
            {/* Solution */}
            <div>
              <div className="flex items-center gap-2 text-green-500 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold uppercase text-sm">La solution</span>
              </div>
              <h2 className="text-3xl font-bold mb-6">Le Filon fait le tri pour vous</h2>
              <ul className="space-y-4 text-neutral-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Alertes ciblées selon votre profil</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Score Go/No-Go sur chaque AO</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Plus de temps pour rédiger vos réponses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>50€/mois tout inclus (3x moins cher)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Comment ça marche
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-yellow-500 font-bold mb-2">1. Créez votre profil</div>
              <p className="text-neutral-400">
                Secteurs, régions, budget cible. 2 minutes pour configurer.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-yellow-500 font-bold mb-2">2. Recevez les alertes</div>
              <p className="text-neutral-400">
                On scanne le BOAMP et les sources officielles. Vous recevez les matchs par email.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-yellow-500 font-bold mb-2">3. Gagnez des marchés</div>
              <p className="text-neutral-400">
                Concentrez-vous sur les AO à fort potentiel. Maximisez votre taux de succès.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-6 border-t border-neutral-800 bg-neutral-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tarifs <span className="text-yellow-500">disruptifs</span>
          </h2>
          <p className="text-xl text-neutral-400 mb-8">
            La concurrence facture 1 500 à 4 000€/an. Nous, c'est 50€/mois tout inclus.
          </p>

          <div className="max-w-sm mx-auto mb-12">
            <div className="border-2 border-yellow-500 p-6 bg-yellow-500/5">
              <div className="text-3xl font-black">50€<span className="text-neutral-500 text-lg">/mois</span></div>
              <div className="text-yellow-500 font-bold">Pro — Tout inclus</div>
              <div className="text-neutral-400 text-sm mt-1">600€/an · Essai gratuit 14 jours</div>
            </div>
          </div>
          
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold hover:bg-neutral-200 transition-colors"
          >
            Comparer les offres <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à trouver <span className="text-yellow-500">le filon</span> ?
          </h2>
          <p className="text-xl text-neutral-400 mb-8">
            Essai gratuit 14 jours. Sans engagement.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-500 text-black font-bold text-lg hover:bg-yellow-400 transition-colors"
          >
            Commencer maintenant <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500">© 2026 Le Filon AO — Metatron Labs</p>
          <div className="flex gap-6 text-neutral-500">
            <Link href="/pricing" className="hover:text-white">Tarifs</Link>
            <Link href="/subscribe" className="hover:text-white">S'inscrire</Link>
            <a href="mailto:contact@lefilonao.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
