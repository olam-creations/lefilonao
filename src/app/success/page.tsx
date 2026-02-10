'use client';

import { CheckCircle, ArrowRight, Search, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ease = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] };

const STEPS = [
  {
    icon: Search,
    title: 'Configurez vos alertes',
    desc: 'Secteurs, régions, budget. Votre radar est prêt.',
  },
  {
    icon: Zap,
    title: 'Recevez les opportunités',
    desc: 'Score Go/No-Go pour chaque appel d\'offres.',
  },
  {
    icon: TrendingUp,
    title: 'Préparez et gagnez',
    desc: 'Analyse du DCE, aide à la réponse, intelligence marché.',
  },
];

function SuccessContent() {
  useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Le Filon <span className="gradient-text">AO</span>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center px-6 pt-20 pb-16">
        <motion.div
          className="max-w-lg w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ease}
        >
          {/* Success icon */}
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/25"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Bienvenue dans Le Filon <span className="gradient-text">AO</span>
          </h1>
          <p className="text-slate-500 text-lg mb-10">
            Votre abonnement Pro est actif.
          </p>

          {/* Steps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 text-left">
            <div className="space-y-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...ease, delay: 0.4 + i * 0.15 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-indigo-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-0.5">{step.title}</h3>
                      <p className="text-sm text-slate-500">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="btn-primary w-full justify-center py-3.5 text-base mb-4"
          >
            Accéder au dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-slate-400 text-sm">
            Redirection automatique dans {countdown}s
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-slate-400">Chargement...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
