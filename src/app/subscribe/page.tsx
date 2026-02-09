'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { setToken, setTrialStart, initOnboarding } from '@/lib/auth';
import { api, API_URL } from '@/lib/api';

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

const COMPANY_SIZES = [
  { value: 'auto', label: 'Auto-entrepreneur' },
  { value: '1-10', label: '1 à 10 salariés' },
  { value: '11-50', label: '11 à 50 salariés' },
  { value: '51-250', label: '51 à 250 salariés' },
  { value: '250+', label: 'Plus de 250 salariés' },
];

const FREQUENCIES = [
  { value: 'instant', label: 'Instantané', desc: 'Dès qu\'un AO correspond' },
  { value: 'daily', label: 'Quotidien', desc: 'Un digest chaque matin', recommended: true },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Un résumé chaque lundi' },
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
  const [keywordInput, setKeywordInput] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    company: '',
    sectors: [] as string[],
    companySize: '',
    keywords: [] as string[],
    notificationFrequency: 'daily',
    regions: [] as string[],
    budgetMin: 50000,
    budgetMax: 500000,
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

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !formData.keywords.includes(kw) && formData.keywords.length < 10) {
      setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, kw] }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kw),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.subscribe({
        ...formData,
        source: plan ? `pricing-${plan}` : 'landing-page',
      });

      const data = await res.json();

      if (!res.ok && res.status !== 409) {
        setError(data.error || `Erreur ${res.status}`);
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        return;
      }

      const authToken = data.token;
      if (authToken) {
        setToken(authToken);
      }

      // Initialize trial and onboarding
      setTrialStart();
      initOnboarding();

      if (plan && (plan === 'starter' || plan === 'pro')) {
        const checkoutRes = await fetch(`${API_URL}/api/excalibur/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
        setError(checkoutData.error || 'Erreur lors du paiement');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        return;
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Erreur de connexion. Réessayez.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Coordonnées', 'Secteurs', 'Affinage', 'Régions'];
  const progressPercent = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
                  isDone
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20'
                    : isActive
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-200 text-slate-400'
                }`}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span className={`text-sm hidden sm:block ${isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Coordonnées */}
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
                <h2 className="text-xl font-bold text-slate-900 mb-1">Vos coordonnées</h2>
                <p className="text-slate-500 text-sm mb-6">Pour créer votre espace de veille.</p>
                <div className="space-y-4 mb-8">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="vous@entreprise.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Prénom"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => goToStep(2)}
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Secteurs */}
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
                <h2 className="text-xl font-bold text-slate-900 mb-1">Vos secteurs d&apos;expertise</h2>
                <p className="text-slate-500 text-sm mb-6">Sélectionnez les domaines où vous répondez aux AO.</p>
                <div className="grid grid-cols-2 gap-2 mb-8 max-h-[360px] overflow-y-auto">
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
                <div className="flex gap-3">
                  <button onClick={() => goToStep(1)} className="btn-secondary flex-1 justify-center">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={() => goToStep(3)}
                    disabled={formData.sectors.length === 0}
                    className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Affinage */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={ease}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-1">Affinez votre profil</h2>
                <p className="text-slate-500 text-sm mb-6">Pour des alertes encore plus pertinentes.</p>

                {/* Company Size */}
                <div className="mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-3">Taille de l&apos;entreprise</p>
                  <div className="space-y-2">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setFormData((prev) => ({ ...prev, companySize: size.value }))}
                        className={`radio-card w-full ${formData.companySize === size.value ? 'selected' : ''}`}
                      >
                        <div className="radio-dot" />
                        <span className="text-sm text-slate-700">{size.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-3">
                    Mots-clés <span className="text-slate-400 font-normal">(optionnel, max 10)</span>
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                      placeholder="Ex : cybersécurité, React, audit..."
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                    <button
                      onClick={addKeyword}
                      disabled={!keywordInput.trim()}
                      className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                    >
                      Ajouter
                    </button>
                  </div>
                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((kw) => (
                        <span key={kw} className="keyword-tag">
                          {kw}
                          <button onClick={() => removeKeyword(kw)} aria-label={`Supprimer ${kw}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notification Frequency */}
                <div className="mb-8">
                  <p className="text-sm text-slate-700 font-medium mb-3">Fréquence des alertes</p>
                  <div className="space-y-2">
                    {FREQUENCIES.map((freq) => (
                      <button
                        key={freq.value}
                        onClick={() => setFormData((prev) => ({ ...prev, notificationFrequency: freq.value }))}
                        className={`radio-card w-full ${formData.notificationFrequency === freq.value ? 'selected' : ''}`}
                      >
                        <div className="radio-dot" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700 font-medium">{freq.label}</span>
                            {freq.recommended && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md">
                                Recommandé
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{freq.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => goToStep(2)} className="btn-secondary flex-1 justify-center">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={() => goToStep(4)}
                    className="btn-primary flex-1 justify-center"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Régions & Budget */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={ease}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-1">Régions & budget</h2>
                <p className="text-slate-500 text-sm mb-6">Affinez votre recherche (optionnel).</p>

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

                <div className="mb-8">
                  <p className="text-sm text-slate-700 font-medium mb-3">
                    Budget cible :{' '}
                    <span className="font-mono gradient-text">
                      {(formData.budgetMin / 1000).toFixed(0)}k&euro; &ndash; {(formData.budgetMax / 1000).toFixed(0)}k&euro;
                    </span>
                  </p>
                  <input
                    type="range"
                    min={10000}
                    max={2000000}
                    step={10000}
                    value={formData.budgetMax}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
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
                  <button onClick={() => goToStep(3)} className="btn-secondary flex-1 justify-center">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? 'Redirection...'
                      : plan
                        ? `Démarrer l'essai`
                        : 'S\'inscrire gratuitement'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
