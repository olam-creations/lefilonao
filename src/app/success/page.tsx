'use client';

import { CheckCircle, ArrowRight, Search, Zap, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { checkAuth, clearAuthCache } from '@/lib/auth';

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

type PaymentStatus = 'checking' | 'confirmed' | 'failed';

const MAX_POLLS = 10;
const POLL_INTERVAL = 2000;

function SuccessContent() {
  useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [countdown, setCountdown] = useState(5);

  // Redirect to login if not authenticated (prevents random visitors seeing this page)
  useEffect(() => {
    checkAuth().then((auth) => {
      if (!auth.authenticated) router.replace('/login');
    }).catch(() => {});
  }, [router]);

  const checkSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/stripe/subscription', { credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();
      return data.plan === 'pro' && data.stripe_status === 'active';
    } catch {
      return false;
    }
  }, []);

  // Poll subscription status — webhook may take a few seconds
  useEffect(() => {
    let polls = 0;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      const confirmed = await checkSubscription();
      if (confirmed) {
        clearAuthCache(); // Flush stale plan=free so dashboard loads as pro
        setStatus('confirmed');
        return;
      }
      polls++;
      if (polls >= MAX_POLLS) {
        setStatus('failed');
        return;
      }
      setTimeout(poll, POLL_INTERVAL);
    };

    poll();
    return () => { stopped = true; };
  }, [checkSubscription]);

  // Auto-redirect countdown (only when confirmed)
  useEffect(() => {
    if (status !== 'confirmed') return;
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
  }, [status]);

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
          {/* Status icon */}
          {status === 'checking' && (
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
            </div>
          )}
          {status === 'confirmed' && (
            <motion.div
              className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/25"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
          )}
          {status === 'failed' && (
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/25">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            {status === 'checking' && 'Activation en cours...'}
            {status === 'confirmed' && (
              <>Bienvenue dans Le Filon <span className="gradient-text">AO</span></>
            )}
            {status === 'failed' && 'Presque terminé'}
          </h1>
          <p className="text-slate-500 text-lg mb-10">
            {status === 'checking' && 'Vérification de votre paiement...'}
            {status === 'confirmed' && 'Votre abonnement Pro est actif.'}
            {status === 'failed' && 'Votre paiement est en cours de traitement. L\'activation peut prendre quelques instants.'}
          </p>

          {/* Steps (show when confirmed) */}
          {status === 'confirmed' && (
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
          )}

          {/* CTA */}
          <Link
            href="/dashboard"
            className="btn-primary w-full justify-center py-3.5 text-base mb-4"
          >
            Accéder au dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>

          {status === 'confirmed' && (
            <p className="text-slate-400 text-sm">
              Redirection automatique dans {countdown}s
            </p>
          )}
          {status === 'failed' && (
            <p className="text-slate-400 text-sm">
              Votre compte sera activé automatiquement dès la confirmation du paiement.
            </p>
          )}
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
