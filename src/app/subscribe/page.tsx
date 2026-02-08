'use client';

import { useState } from 'react';
import { CheckCircle, Zap, Building2, ArrowRight } from 'lucide-react';

const SECTORS = [
  // IT & Digital
  'Développement Web & Logiciel',
  'Intelligence Artificielle & ML',
  'Cloud & Infrastructure',
  'Cybersécurité',
  'Data & Analytics',
  'Applications Mobiles',
  'Conseil IT & Digital',
  'Intégration Systèmes',
  // BTP & Construction
  'BTP & Travaux Publics',
  'Architecture & Urbanisme',
  'Génie Civil',
  'Rénovation Énergétique',
  // Ingénierie & Industrie
  'Ingénierie Industrielle',
  'Électronique & Électricité',
  'Mécanique & Maintenance',
  'Environnement & Déchets',
  // Services
  'Formation & Éducation',
  'Communication & Marketing',
  'Études & Conseil',
  'Services Juridiques',
  'Comptabilité & Finance',
  // Santé & Social
  'Santé & Médical',
  'Services Sociaux',
  // Transport & Logistique
  'Transport & Mobilité',
  'Logistique & Supply Chain',
  // Autres
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

export default function SubscribePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    company: '',
    sectors: [] as string[],
    regions: [] as string[],
    budgetMin: 50000,
    budgetMax: 500000,
  });

  const toggleSector = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector],
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/excalibur/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'landing-page',
        }),
      });
      
      if (res.ok) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Inscription confirmée!</h1>
          <p className="text-neutral-400 mb-6">
            Vous recevrez votre premier digest d'appels d'offres très bientôt.
          </p>
          <div className="bg-neutral-900 border border-neutral-800 p-4 text-left">
            <p className="text-sm text-neutral-500 mb-2">Votre profil:</p>
            <p className="font-mono text-sm">
              {formData.sectors.length > 0 && `Secteurs: ${formData.sectors.join(', ')}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <span className="text-2xl font-black"><span className="text-yellow-500">Le Filon</span> AO</span>
          <span className="text-neutral-600 text-sm ml-2">| Veille marchés publics</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            <span className="text-yellow-500">Le filon</span> d'appels d'offres
          </h1>
          <p className="text-xl md:text-2xl text-neutral-300 mb-4">
            Trouvez les marchés publics faits pour vous.
          </p>
          <p className="text-lg text-neutral-500 mb-8 max-w-2xl mx-auto">
            On scanne le BOAMP et les sources officielles 24/7. 
            Vous recevez uniquement les AO qui matchent votre expertise, avec un score Go/No-Go.
          </p>
          <div className="flex gap-4 justify-center text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> 3 AO/mois gratuits
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Score de compatibilité
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Sans carte bancaire
            </span>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1 flex-1 ${i <= step ? 'bg-white' : 'bg-neutral-800'}`}
              />
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Votre email professionnel</h2>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="vous@entreprise.com"
                className="w-full bg-neutral-900 border border-neutral-700 p-4 text-lg mb-4 focus:border-white focus:outline-none"
              />
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Prénom"
                className="w-full bg-neutral-900 border border-neutral-700 p-4 text-lg mb-4 focus:border-white focus:outline-none"
              />
              <input
                type="text"
                value={formData.company}
                onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nom de l'entreprise"
                className="w-full bg-neutral-900 border border-neutral-700 p-4 text-lg mb-6 focus:border-white focus:outline-none"
              />
              <button
                onClick={() => setStep(2)}
                disabled={!formData.email.includes('@')}
                className="w-full bg-white text-black p-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Sectors */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Vos secteurs d'expertise</h2>
              <p className="text-neutral-400 mb-6">Sélectionnez les domaines où vous répondez aux AO</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SECTORS.map(sector => (
                  <button
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className={`p-4 border text-left transition-colors ${
                      formData.sectors.includes(sector)
                        ? 'border-white bg-white text-black'
                        : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-neutral-700 p-4 font-bold"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={formData.sectors.length === 0}
                  className="flex-1 bg-white text-black p-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continuer <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Regions & Budget */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Régions & Budget</h2>
              <p className="text-neutral-400 mb-6">Affinez votre recherche</p>
              
              <div className="mb-6">
                <p className="text-sm text-neutral-500 mb-3">Régions (optionnel)</p>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(region => (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-2 border text-sm transition-colors ${
                        formData.regions.includes(region)
                          ? 'border-white bg-white text-black'
                          : 'border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-sm text-neutral-500 mb-3">
                  Budget cible: {(formData.budgetMin / 1000).toFixed(0)}k€ - {(formData.budgetMax / 1000).toFixed(0)}k€
                </p>
                <input
                  type="range"
                  min={10000}
                  max={2000000}
                  step={10000}
                  value={formData.budgetMax}
                  onChange={e => setFormData(prev => ({ ...prev, budgetMax: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-neutral-700 p-4 font-bold"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-white text-black p-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Inscription...' : 'S\'inscrire gratuitement'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-neutral-500 mb-8">Utilisé par des agences et ESN en France</p>
          <div className="flex justify-center gap-8 opacity-50">
            <Building2 className="w-8 h-8" />
            <Building2 className="w-8 h-8" />
            <Building2 className="w-8 h-8" />
            <Building2 className="w-8 h-8" />
          </div>
        </div>
      </section>
    </div>
  );
}
