'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Users, BarChart3, ArrowRight, Trophy, Landmark, Calendar } from 'lucide-react';
import Link from 'next/link';
import { isAuthenticated, markOnboardingStep } from '@/lib/auth';

interface Attribution {
  id: string;
  rfpTitle: string;
  buyerName: string;
  winnerName: string;
  amount: number;
  notificationDate: string;
}

interface MarketInsight {
  sector: string;
  totalContracts: number;
  totalValue: number;
  avgValue: number;
  topBuyers: { name: string; count: number }[];
  topWinners: { name: string; count: number }[];
}

const CPV_SECTORS = [
  { code: '72', name: 'Services IT', icon: BarChart3 },
  { code: '48', name: 'Logiciels', icon: BarChart3 },
  { code: '79', name: 'Services entreprises', icon: Building2 },
  { code: '71', name: 'Architecture & Ingénierie', icon: Building2 },
  { code: '80', name: 'Formation', icon: Users },
  { code: '64', name: 'Télécoms', icon: BarChart3 },
];

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M\u20ac`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k\u20ac`;
  return `${amount}\u20ac`;
}

function StatCard({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent || 'from-slate-300 to-slate-400'}`} />
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-3xl font-bold ${accent ? 'gradient-text' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

export default function MarketPage() {
  const [selectedSector, setSelectedSector] = useState('72');
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    markOnboardingStep('market');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [insightsRes, attrRes] = await Promise.all([
          fetch(`https://meragel.vercel.app/api/excalibur/osint?type=market&cpv=${selectedSector}`),
          fetch(`https://meragel.vercel.app/api/excalibur/osint?type=attributions&cpv=${selectedSector}&limit=10`),
        ]);

        if (insightsRes.ok) {
          const data = await insightsRes.json();
          setInsights(data.market);
        }

        if (attrRes.ok) {
          const data = await attrRes.json();
          setAttributions(data.attributions || []);
        }
      } catch {
        // silently fail, show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSector]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              Le Filon <span className="gradient-text">AO</span>
            </Link>
            <nav className="hidden md:flex gap-4 text-sm">
              <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
              <Link href="/dashboard/market" className="text-indigo-600 font-medium">Intelligence</Link>
            </nav>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm py-2 px-4">
            Retour
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Intelligence de Marché
          </h1>
          <p className="text-slate-500">
            Analysez les marchés attribués, identifiez les acheteurs et vos concurrents.
          </p>
        </div>

        {/* Sector Selection */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CPV_SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isActive = selectedSector === sector.code;
            return (
              <button
                key={sector.code}
                onClick={() => setSelectedSector(sector.code)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm shadow-indigo-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {sector.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Chargement des données...</div>
        ) : (
          <>
            {/* Stats Cards */}
            {insights && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Marchés attribués"
                  value={insights.totalContracts.toLocaleString()}
                  icon={<BarChart3 className="w-4 h-4" />}
                />
                <StatCard
                  label="Volume total"
                  value={formatAmount(insights.totalValue)}
                  icon={<TrendingUp className="w-4 h-4" />}
                  accent="from-emerald-400 to-emerald-500"
                />
                <StatCard
                  label="Valeur moyenne"
                  value={formatAmount(insights.avgValue)}
                  icon={<Building2 className="w-4 h-4" />}
                  accent="from-indigo-400 to-violet-500"
                />
                <StatCard
                  label="Top acheteurs"
                  value={String(insights.topBuyers.length)}
                  icon={<Users className="w-4 h-4" />}
                />
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Top Buyers */}
              {insights && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Landmark className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-slate-900">Top Acheteurs</h2>
                  </div>
                  <div className="space-y-3">
                    {insights.topBuyers.map((buyer, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 truncate text-sm">{buyer.name || 'Non spécifié'}</span>
                        </div>
                        <span className="text-sm font-mono gradient-text font-semibold flex-shrink-0 ml-4">
                          {buyer.count} marchés
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Winners */}
              {insights && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-lg font-semibold text-slate-900">Top Gagnants</h2>
                  </div>
                  <div className="space-y-3">
                    {insights.topWinners.map((winner, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-semibold text-emerald-600 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 truncate text-sm">{winner.name || 'Non spécifié'}</span>
                        </div>
                        <span className="text-sm font-mono text-emerald-600 font-semibold flex-shrink-0 ml-4">
                          {winner.count} victoires
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Attributions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">Dernières Attributions</h2>
              </div>
              <div className="space-y-0">
                {attributions.map((attr) => (
                  <div key={attr.id} className="flex justify-between items-start gap-4 py-4 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 mb-1.5 leading-snug">
                        {attr.rfpTitle.length > 100
                          ? attr.rfpTitle.substring(0, 100) + '...'
                          : attr.rfpTitle}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Landmark className="w-3 h-3" />
                          {attr.buyerName || 'Acheteur non spécifié'}
                        </span>
                        <span>&middot;</span>
                        <span>{new Date(attr.notificationDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 font-mono flex-shrink-0">
                      {formatAmount(attr.amount)}
                    </span>
                  </div>
                ))}
                {attributions.length === 0 && (
                  <p className="text-center text-slate-400 py-8">Aucune attribution trouvée pour ce secteur.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
