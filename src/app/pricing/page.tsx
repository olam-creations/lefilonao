'use client';

import { Check, ArrowRight, ChevronDown, Search, Zap, FileText, Pencil, TrendingUp, Mail, Download, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';

const PRICE = 30;

const FREE_FEATURES = [
  '5 appels d\'offres par mois',
  'Digest hebdomadaire par email',
  'Filtrage par secteur et région',
];

const PRO_FEATURES = [
  'Appels d\'offres illimités',
  'Alertes quotidiennes par email',
  'Score Go/No-Go pour chaque AO',
  'Intelligence acheteur (DECP)',
  'Analyse du DCE par IA',
  'Aide à la préparation des réponses',
  'Export Excel/CSV',
  'Support email prioritaire',
];

const VALUE_BLOCKS = [
  {
    icon: Search,
    title: 'Veille BOAMP complète',
    desc: 'Scan continu de toutes les annonces. Filtrage par secteur, région et budget. Aucun AO ne vous échappe.',
  },
  {
    icon: Zap,
    title: 'Score Go/No-Go par IA',
    desc: 'Chaque AO est analysé selon votre profil : éligibilité, alignement, rentabilité, concurrence, délais.',
  },
  {
    icon: Mail,
    title: 'Alertes quotidiennes',
    desc: 'Les opportunités qui matchent votre profil, dans votre boîte mail chaque matin. Zéro bruit.',
  },
  {
    icon: FileText,
    title: 'Analyse du DCE par IA',
    desc: 'Critères de sélection, pièces requises, pondération : l\'IA extrait l\'essentiel du dossier de consultation.',
  },
  {
    icon: Pencil,
    title: 'Aide à la réponse',
    desc: 'Plan de mémoire technique, résumé exécutif, checklist conformité (DC1, DC2, attestations).',
  },
  {
    icon: TrendingUp,
    title: 'Intelligence acheteur',
    desc: 'Historique des marchés, montants attribués, fournisseurs récurrents. Analysez l\'acheteur avant de répondre.',
  },
  {
    icon: Download,
    title: 'Export Excel / CSV',
    desc: 'Exportez vos AO filtrés en un clic. Partagez avec votre équipe ou intégrez à vos outils.',
  },
  {
    icon: Headphones,
    title: 'Support prioritaire',
    desc: 'Une question ? On vous répond par email sous 24h. Pas de chatbot, de vraies réponses.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Quelle est la différence entre Free et Pro\u00a0?',
    a: 'Le plan gratuit vous donne 5 AO par mois avec un digest hebdomadaire. Pro débloque l\'accès illimité, les scores Go/No-Go par IA, l\'intelligence acheteur, et les alertes quotidiennes.',
  },
  {
    q: 'Quelles sources couvrez-vous\u00a0?',
    a: 'BOAMP (Bulletin Officiel des Annonces de Marchés Publics) et bientôt TED Europa pour les marchés européens.',
  },
  {
    q: 'Comment fonctionne le score Go/No-Go\u00a0?',
    a: 'Notre IA analyse chaque appel d\'offres selon votre profil et 5 critères\u00a0: éligibilité, alignement, rentabilité, concurrence, et délais.',
  },
  {
    q: 'Comment fonctionne l\'aide à la réponse\u00a0?',
    a: 'L\'IA lit le DCE, extrait les critères et les pièces requises, puis génère un plan de mémoire technique, un résumé exécutif et une checklist de conformité adaptés à votre profil.',
  },
  {
    q: 'Puis-je annuler à tout moment\u00a0?',
    a: 'Oui, sans engagement. Annulez depuis votre espace ou par simple email.',
  },
];

const ease = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors pr-4">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={ease}
            className="overflow-hidden"
          >
            <p className="text-slate-500 pb-5 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header variant="public" />

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />
        <div className="relative">
          <p className="text-indigo-600 text-sm font-semibold mb-3 tracking-wide uppercase">Tarification</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-5">
            Commencez gratuitement. <span className="gradient-text">Passez à Pro quand vous êtes prêt.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            De la veille à la réponse : scoring, analyse du DCE, aide à la rédaction,
            intelligence acheteur. Tout pour gagner des marchés.
          </p>
        </div>
      </section>

      {/* Pricing Cards — Two columns */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-10 border border-slate-200">
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-slate-900">0&euro;</span>
                <span className="text-xl text-slate-400">/mois</span>
              </div>
              <p className="text-slate-900 font-semibold mt-3 text-lg">Gratuit</p>
              <p className="text-slate-400 mt-1 text-sm">
                Pour découvrir les marchés publics
              </p>
            </div>

            <ul className="space-y-3.5 mb-10">
              {FREE_FEATURES.map((feature, i) => (
                <motion.li
                  key={feature}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, ...ease }}
                >
                  <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/subscribe"
              className="btn-secondary w-full justify-center py-3.5 text-base"
            >
              S&apos;inscrire gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="gradient-border active">
            <div className="bg-white rounded-2xl p-10 glow-indigo-strong">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-5 border border-indigo-100">
                  Recommandé
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold gradient-text-price">{PRICE}&euro;</span>
                  <span className="text-xl text-slate-400">/mois</span>
                </div>
                <p className="text-slate-900 font-semibold mt-3 text-lg">Pro</p>
                <p className="text-slate-400 mt-1 text-sm">
                  Sans engagement &middot; Annulation facile
                </p>
              </div>

              <ul className="space-y-3.5 mb-10">
                {PRO_FEATURES.map((feature, i) => (
                  <motion.li
                    key={feature}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, ...ease }}
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Link
                href="/subscribe?plan=pro"
                className="btn-primary w-full justify-center py-3.5 text-base"
              >
                Commencer
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What you get with Pro */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold text-center mb-3 tracking-wide uppercase">Tout est inclus</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-4">
            Ce que vous obtenez avec Pro
          </h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">
            Pas d&apos;options cachées, pas de modules en supplément. Chaque fonctionnalité est accessible dès le premier jour.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {VALUE_BLOCKS.map((block, i) => {
              const Icon = block.icon;
              return (
                <motion.div
                  key={block.title}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-indigo-500/20 group-hover:shadow-md group-hover:shadow-indigo-500/25 transition-shadow">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{block.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{block.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-indigo-600 text-sm font-semibold text-center mb-3 tracking-wide uppercase">FAQ</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-10">
            Questions fréquentes
          </h2>
          <div>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-40" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-5">
            Prêt à trouver votre prochain marché ?
          </h2>
          <p className="text-slate-400 mb-8">
            Veille, scoring, analyse du DCE, aide à la réponse. Commencez gratuitement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 text-base py-3.5 px-8 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Plan gratuit
            </Link>
            <Link
              href="/subscribe?plan=pro"
              className="inline-flex items-center gap-2 text-base py-3.5 px-8 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10 transition-all"
            >
              Passer à Pro &mdash; {PRICE}&euro;/mois
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-transparent" style={{ borderImage: 'linear-gradient(to right, transparent, #c7d2fe, transparent) 1' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">&copy; 2026 Le Filon AO</p>
          <div className="flex gap-8 text-slate-400 text-sm">
            <Link href="/" className="hover:text-slate-700 transition-colors">Accueil</Link>
            <Link href="/subscribe" className="hover:text-slate-700 transition-colors">S&apos;inscrire</Link>
            <a href="mailto:contact@lefilonao.com" className="hover:text-slate-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
