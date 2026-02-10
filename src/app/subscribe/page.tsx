'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { clearAuthCache } from '@/lib/auth';
import StripeCheckoutModal from '@/components/StripeCheckoutModal';

const ease = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };

const SECTORS = [
  'Développement Web & Logiciel',
  'Intelligence Artificielle & ML',
  'Cloud & Infrastructure',
  'Cybersécurité',
  'Data & Analytics',
  'Applications Mobiles',
  'Conseil IT & Digital',
  'Intégration Systèmes',
  'BTP & Travaux Publics',
  'Architecture & Urbanisme',
  'Génie Civil',
  'Rénovation Énergétique',
  'Ingénierie Industrielle',
  'Électronique & Électricité',
  'Mécanique & Maintenance',
  'Environnement & Déchets',
  'Formation & Éducation',
  'Communication & Marketing',
  'Études & Conseil',
  'Services Juridiques',
  'Comptabilité & Finance',
  'Santé & Médical',
  'Services Sociaux',
  'Transport & Mobilité',
  'Logistique & Supply Chain',
  'Restauration & Traiteur',
  'Nettoyage & Propreté',
  'Sécurité & Gardiennage',
  'Événementiel',
];

const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Côte d\'Azur',
  'Grand Est',
  'Bretagne',
  'Toute la France',
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

function SubscribeForm() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    sectors: [] as string[],
    regions: [] as string[],
  });

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const toggleSector = (sector: string) => {
    setFormData((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter((s) => s !== sector)
        : [...prev.sectors, sector],
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData((prev) => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.register({
        ...formData,
        source: plan ? `pricing-${plan}` : 'landing-page',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Erreur ${res.status}`);
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        setLoading(false);
        return;
      }

      clearAuthCache();

      // Pro plan: open Stripe checkout
      if (plan === 'pro') {
        const checkoutRes = await api.checkout();
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.clientSecret) {
          setCheckoutSecret(checkoutData.clientSecret);
          setLoading(false);
          return;
        }
        setError(checkoutData.error || 'Erreur lors du paiement');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        setLoading(false);
        return;
      }

      // Free plan: redirect to dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Erreur de connexion. Réessayez.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      setLoading(false);
    }
  };

  const steps = ['Compte', 'Préférences'];
  const progressPercent = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="glass">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Le Filon <span className="gradient-text">AO</span>
          </Link>
          <span className="text-sm text-slate-400">Inscription</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-2">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Step labels */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone || isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span className={`text-sm ${isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Email + password + firstName */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={ease}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-1">Créez votre compte</h2>
                <p className="text-slate-500 text-sm mb-6">Pour accéder à votre espace de veille.</p>
                <div className="space-y-4 mb-8">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="vous@entreprise.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Mot de passe (8 caractères min.)"
                    minLength={8}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Prénom"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => goToStep(2)}
                  disabled={
                    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email) ||
                    formData.password.length < 8 ||
                    !formData.firstName.trim()
                  }
                  className="btn-primary w-full justify-center py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Sectors + Regions (optional) */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={ease}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-1">Vos préférences</h2>
                <p className="text-slate-500 text-sm mb-6">Secteurs et régions (optionnel, modifiable plus tard).</p>

                <div className="mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-3">Secteurs d&apos;expertise</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
                    {SECTORS.map((sector) => {
                      const isSelected = formData.sectors.includes(sector);
                      return (
                        <motion.button
                          key={sector}
                          onClick={() => toggleSector(sector)}
                          className={`text-left text-sm px-3 py-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium shadow-sm shadow-indigo-500/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                          whileTap={{ scale: 0.97 }}
                        >
                          {sector}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-sm text-slate-700 font-medium mb-3">Régions</p>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((region) => {
                      const isSelected = formData.regions.includes(region);
                      return (
                        <motion.button
                          key={region}
                          onClick={() => toggleRegion(region)}
                          className={`text-sm px-3 py-2 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium shadow-sm shadow-indigo-500/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                          whileTap={{ scale: 0.97 }}
                        >
                          {region}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      className={`mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm ${shakeError ? 'animate-shake' : ''}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <button onClick={() => goToStep(1)} className="btn-secondary flex-1 justify-center">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? 'Création...'
                      : plan === 'pro'
                        ? 'Continuer vers le paiement'
                        : 'Créer mon compte gratuit'}
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-600 mt-4 transition-colors"
                >
                  Passer cette étape
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Se connecter
          </Link>
        </p>
      </div>

      {checkoutSecret && (
        <StripeCheckoutModal
          clientSecret={checkoutSecret}
          onClose={() => setCheckoutSecret(null)}
        />
      )}
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-400">Chargement...</p>
        </div>
      }
    >
      <SubscribeForm />
    </Suspense>
  );
}
