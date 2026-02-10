'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Search, Zap, TrendingUp, Check, X,
  BarChart3, Mail, Shield, Sparkles, FileText, Pencil, Bookmark,
  BrainCircuit, Wand2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ease = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: ease },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

/* ─── Spotlight handler for feature cards ─── */
function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);
  return { ref, handleMouse };
}

/* ─── Dashboard Preview Mockup ─── */
function DashboardMockup() {
  const mockRfps = [
    { score: 92, label: 'GO', title: 'Maintenance informatique - Ville de Lyon', issuer: 'Mairie de Lyon', budget: '120k€' },
    { score: 78, label: 'GO', title: 'Développement application web citoyen', issuer: 'Métropole de Bordeaux', budget: '85k€' },
    { score: 54, label: 'MAYBE', title: 'Infogérance et support niveau 2', issuer: 'CHU de Toulouse', budget: '200k€' },
  ];

  return (
    <motion.div
      className="mt-20 max-w-5xl mx-auto px-4"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ease, delay: 0.5 }}
    >
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-500/10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row h-[400px]">
          {/* Sidebar Mockup */}
          <div className="hidden md:flex w-48 border-r border-slate-100 bg-slate-50/50 p-6 flex-col gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-2 rounded-full ${i === 1 ? 'bg-indigo-200 w-12' : 'bg-slate-200 w-16'}`} />
              ))}
            </div>
          </div>
          {/* Content Mockup */}
          <div className="flex-1 p-6 sm:p-8 overflow-hidden relative bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="h-4 bg-slate-100 rounded-full w-32" />
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100" />
            </div>
            {/* Mock cards */}
            <div className="space-y-4">
              {mockRfps.map((rfp, i) => (
                <motion.div
                  key={rfp.title}
                  className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...ease, delay: 0.7 + i * 0.15 }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      rfp.label === 'GO'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {rfp.score} &middot; {rfp.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{rfp.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rfp.issuer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-xs font-mono font-bold text-slate-500">{rfp.budget}</span>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>
    </motion.div>
  );
}

/* ─── Feature Card with Spotlight ─── */
function FeatureCard({
  icon, title, desc, className = '',
}: {
  icon: React.ReactNode; title: string; desc: string; className?: string;
}) {
  const { handleMouse } = useSpotlight();

  return (
    <motion.div
      className={`spotlight-card bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 hover:border-slate-300 transition-all group relative overflow-hidden flex flex-col justify-between ${className}`}
      variants={fadeUp}
      onMouseMove={handleMouse}
    >
      <div className="relative z-10">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300 shadow-sm border border-slate-100">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
      </div>
      <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
        Découvrir <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </motion.div>
  );
}

export default function LandingContent() {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-white">
      <Header variant="public" />

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative pt-24 pb-16 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* Grid dot background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/50 to-white" />

        <motion.div className="relative max-w-5xl mx-auto text-center" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ease, delay: 0.1 }}
          >
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-10 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-indigo-400" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-indigo-700 text-[10px] font-bold uppercase tracking-widest">
                Offre Fondateur &mdash; 50% de réduction
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-8 uppercase">
              La veille marchés <br />
              <span className="gradient-text italic pr-[0.3em] pb-[0.1em] inline-block">intelligente</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              Détectez, analysez et répondez aux appels d&apos;offres en un temps record.
              <span className="hidden sm:inline"> La puissance de l&apos;IA au service de votre croissance.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/subscribe" className="btn-primary text-base py-4 px-10 rounded-2xl shadow-xl shadow-indigo-500/20">
                Essayer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="btn-secondary text-base py-4 px-10 rounded-2xl">
                Voir les tarifs
              </Link>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-10 mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ease, delay: 0.4 }}
          >
            <span className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Shield className="w-4 h-4 text-indigo-400" /> Sans carte
            </span>
            <span className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Check className="w-4 h-4 text-emerald-400" /> Sans engagement
            </span>
            <span className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-violet-400" /> Analyse IA
            </span>
          </motion.div>

          {/* Dashboard mockup */}
          <DashboardMockup />
        </motion.div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="py-12 px-6 border-y border-slate-100">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          {[
            { value: '500+', label: 'AO analysés / semaine' },
            { value: '0€', label: 'pour commencer' },
            { value: '25€', label: 'Fondateur /mois' },
            { value: '5 min', label: 'pour s\'inscrire' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Features — Bento Grid ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="text-indigo-600 text-sm font-semibold mb-3 tracking-wide uppercase">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Tout ce qu&apos;il faut pour gagner des marchés
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Hero card — spans 2 cols */}
            <motion.div
              className="spotlight-card md:col-span-2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-xl p-10 text-white relative overflow-hidden group"
              variants={fadeUp}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
              }}
            >
              <div className="absolute inset-0 bg-grid-pattern-dark opacity-30" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">De la veille à la victoire</h3>
                <p className="text-indigo-100 leading-relaxed max-w-md text-lg">
                  Score Go/No-Go, analyse du DCE, aide à la réponse, intelligence concurrentielle.
                  Un seul outil pour tout le cycle de l&apos;appel d&apos;offres.
                </p>
                <div className="flex flex-wrap gap-2 mt-6">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-sm font-medium">Score Go/No-Go</span>
                  <span className="px-3 py-1 bg-white/15 text-white/80 border border-white/20 rounded-full text-sm font-medium">Analyse DCE</span>
                  <span className="px-3 py-1 bg-white/15 text-white/80 border border-white/20 rounded-full text-sm font-medium">Aide réponse</span>
                  <span className="px-3 py-1 bg-white/15 text-white/80 border border-white/20 rounded-full text-sm font-medium">Intel marché</span>
                </div>
              </div>
            </motion.div>

            <FeatureCard
              icon={<Mail className="w-5 h-5" />}
              title="Alertes & scoring IA"
              desc="Alertes quotidiennes ciblées. Chaque AO est scoré selon votre profil : Go, Maybe ou Pass."
            />

            <FeatureCard
              icon={<FileText className="w-5 h-5" />}
              title="Analyse du DCE"
              desc="L'IA extrait les critères de sélection, les pièces requises et la pondération. Vous voyez l'essentiel en un coup d'œil."
            />

            <FeatureCard
              icon={<Pencil className="w-5 h-5" />}
              title="Aide à la réponse"
              desc="Plan de mémoire technique, résumé exécutif, checklist conformité. L'IA structure votre candidature."
            />

            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Marché"
              desc="Qui gagne quoi, à quel prix. Analysez vos concurrents et optimisez votre stratégie tarifaire."
            />

            <FeatureCard
              icon={<Wand2 className="w-5 h-5" />}
              title="Génération IA du mémoire"
              desc="L'IA rédige votre mémoire technique section par section, en temps réel. Vous guidez, elle écrit."
            />

            <FeatureCard
              icon={<BrainCircuit className="w-5 h-5" />}
              title="Coach IA"
              desc="Un coach personnel qui note chaque section, détecte les faiblesses et suggère des améliorations concrètes."
            />

            <FeatureCard
              icon={<Bookmark className="w-5 h-5" />}
              title="Watchlist acheteurs"
              desc="Surveillez vos comptes clés. Soyez alerté dès qu'un acheteur suivi publie un nouvel appel d'offres."
            />
          </motion.div>
        </div>
      </section>

      {/* ─── Problem / Solution ─── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-8 relative">
            {/* Vertical divider on desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px">
              <motion.div
                className="w-full h-full bg-gradient-to-b from-transparent via-indigo-200 to-transparent"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>

            <motion.div
              className="md:pr-12"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <X className="w-5 h-5 text-white" />
                </div>
                <span className="text-red-600 font-semibold text-sm uppercase tracking-wide">Le problème</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Vous perdez des heures sur le BOAMP
              </h2>
              <ul className="space-y-4">
                {[
                  'Des centaines d\'AO à trier chaque semaine',
                  'Des heures à éplucher les DCE pour rien',
                  'Pas le temps de rédiger des réponses solides',
                  'Les outils existants coûtent 1 500-4 000€/an',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-400" />
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="md:pl-12"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wide">La solution</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Le Filon fait le tri pour vous
              </h2>
              <ul className="space-y-4">
                {[
                  'Alertes ciblées + score Go/No-Go automatique',
                  'L\'IA analyse le DCE et extrait l\'essentiel',
                  'Aide à la rédaction : plan, checklist, résumé',
                  'Gratuit pour commencer, Pro dès 25€/mois',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── How it works — Connected Timeline ─── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="text-indigo-600 text-sm font-semibold mb-3 tracking-wide uppercase">Processus</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Comment ça marche
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-0 relative"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[3.25rem] left-[16.67%] right-[16.67%] h-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ transformOrigin: 'left' }}
              />
            </div>

            {[
              {
                icon: <Search className="w-5 h-5" />,
                step: '1',
                title: 'Configurez votre radar',
                desc: 'Secteurs, régions, budget cible. 2 minutes pour paramétrer vos alertes.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                step: '2',
                title: 'Découvrez les opportunités',
                desc: 'Alertes quotidiennes, score Go/No-Go. Vous savez immédiatement où concentrer vos efforts.',
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                step: '3',
                title: 'Préparez et gagnez',
                desc: 'L\'IA analyse le DCE et structure votre réponse. Maximisez vos chances de succès.',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                className="text-center px-8 relative"
                variants={fadeUp}
              >
                {/* Step number */}
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold mx-auto mb-6 shadow-lg shadow-indigo-500/25 relative z-10">
                  {item.step}
                </div>
                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing teaser ─── */}
      <section className="py-24 px-6 bg-slate-50">
        <motion.div
          className="max-w-lg mx-auto text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <p className="text-indigo-600 text-sm font-semibold mb-3 tracking-wide uppercase">Prix</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Commencez gratuitement
          </h2>
          <p className="text-slate-500 mb-10">
            5 AO/mois gratuits. Passez à Pro pour tout débloquer.
          </p>

          <div className="bg-white rounded-2xl p-10 border border-slate-200 glow-indigo relative">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-slate-900">0€</span>
                <p className="text-slate-400 text-sm mt-1">Gratuit</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="text-center">
                <span className="text-4xl font-bold gradient-text-price">25€</span>
                <span className="text-lg text-slate-400">/mois</span>
                <p className="text-slate-400 text-sm mt-1">Fondateur &middot; puis 40€/mois</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center mb-8">
              <span className="badge-go">GO</span>
              <span className="badge-maybe">MAYBE</span>
              <span className="badge-pass">PASS</span>
            </div>
            <Link href="/subscribe" className="btn-primary w-full justify-center py-3.5">
              S&apos;inscrire gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-slate-400 text-xs mt-4">
              Sans carte bancaire &middot; Accès immédiat
            </p>
          </div>

          <Link href="/pricing" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-8 transition-colors group">
            Voir tout ce qui est inclus
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* ─── FAQ with Schema Markup ─── */}
      <section className="py-24 px-6" id="faq">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Combien coûte la veille marchés publics ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Le Filon AO est gratuit pour commencer, avec 5 AO par mois. Le plan Pro est à 50€ TTC/mois (offre Fondateur à 25€/mois pendant 6 mois, puis 40€/mois). C'est 3 à 5 fois moins cher que les solutions traditionnelles."
                  }
                },
                {
                  "@type": "Question",
                  "name": "D'où viennent les appels d'offres ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Nous agrégeons les données officielles du BOAMP (Bulletin Officiel des Annonces de Marchés Publics), le portail officiel de la commande publique française. Les données sont mises à jour quotidiennement."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Puis-je annuler à tout moment ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Oui, tous nos abonnements sont sans engagement. Vous pouvez annuler en un clic depuis votre espace client, sans frais cachés ni période de préavis."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Comment fonctionne l'IA de matching ?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Notre IA analyse sémantiquement votre profil d'activité et compare avec les appels d'offres. Contrairement aux alertes par mots-clés, elle comprend le contexte et vous propose uniquement les opportunités pertinentes pour votre entreprise."
                  }
                }
              ]
            })
          }}
        />
        <motion.div
          className="max-w-3xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div className="text-center mb-12" variants={fadeUp}>
            <p className="text-indigo-600 text-sm font-semibold mb-3 tracking-wide uppercase">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "Combien coûte la veille marchés publics ?",
                a: "Le Filon AO est gratuit pour commencer, avec 5 AO par mois. Le plan Pro est à 50€ TTC/mois (offre Fondateur à 25€/mois pendant 6 mois, puis 40€/mois). C'est 3 à 5 fois moins cher que la concurrence."
              },
              {
                q: "D'où viennent les appels d'offres ?",
                a: "Nous agrégeons les données officielles du BOAMP (Bulletin Officiel des Annonces de Marchés Publics), le portail officiel de la commande publique française. Les données sont mises à jour quotidiennement."
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui, tous nos abonnements sont sans engagement. Vous pouvez annuler en un clic depuis votre espace client, sans frais cachés."
              },
              {
                q: "Comment fonctionne l'IA de matching ?",
                a: "Notre IA analyse sémantiquement votre profil d'activité et compare avec les appels d'offres. Contrairement aux alertes par mots-clés, elle comprend le contexte et vous propose uniquement les opportunités pertinentes."
              }
            ].map((item, i) => (
              <motion.details
                key={i}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden"
                variants={fadeUp}
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-slate-900">{item.q}</span>
                  <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-slate-500 leading-relaxed">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-40" />
        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-5">
            Prêt à trouver votre prochain marché ?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Commencez gratuitement. Sans engagement. Annulation en un clic.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 text-base py-3.5 px-8 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10 transition-all"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <Footer />
    </div>
  );
}
