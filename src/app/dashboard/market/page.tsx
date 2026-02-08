'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Users, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
  { code: '72', name: 'Services IT', icon: '💻' },
  { code: '48', name: 'Logiciels', icon: '📦' },
  { code: '79', name: 'Services entreprises', icon: '🏢' },
  { code: '71', name: 'Architecture & Ingénierie', icon: '🏗️' },
  { code: '80', name: 'Formation', icon: '📚' },
  { code: '64', name: 'Télécoms', icon: '📡' },
];

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M€`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k€`;
  return `${amount}€`;
}

export default function MarketPage() {
  const [selectedSector, setSelectedSector] = useState('72');
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch market insights
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
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedSector]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black">
              <span className="text-yellow-500">Le Filon</span> AO
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-neutral-400 hover:text-white">Dashboard</Link>
              <Link href="/dashboard/market" className="text-yellow-500 font-medium">Market Intel</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">
            🎯 Intelligence de Marché
          </h1>
          <p className="text-neutral-400">
            Analysez les marchés attribués, identifiez les acheteurs et vos concurrents.
          </p>
        </div>

        {/* Sector Selection */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CPV_SECTORS.map(sector => (
            <button
              key={sector.code}
              onClick={() => setSelectedSector(sector.code)}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedSector === sector.code
                  ? 'bg-yellow-500 text-black'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {sector.icon} {sector.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-neutral-500">Chargement des données OSINT...</div>
        ) : (
          <>
            {/* Stats Cards */}
            {insights && (
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                    <BarChart3 className="w-4 h-4" />
                    Marchés attribués
                  </div>
                  <div className="text-3xl font-black">{insights.totalContracts.toLocaleString()}</div>
                </div>
                <div className="border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Volume total
                  </div>
                  <div className="text-3xl font-black text-green-500">{formatAmount(insights.totalValue)}</div>
                </div>
                <div className="border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                    <Building2 className="w-4 h-4" />
                    Valeur moyenne
                  </div>
                  <div className="text-3xl font-black text-yellow-500">{formatAmount(insights.avgValue)}</div>
                </div>
                <div className="border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    Top acheteurs
                  </div>
                  <div className="text-3xl font-black">{insights.topBuyers.length}</div>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Top Buyers */}
              {insights && (
                <div className="border border-neutral-800 p-6">
                  <h2 className="text-lg font-bold mb-4">🏛️ Top Acheteurs</h2>
                  <div className="space-y-3">
                    {insights.topBuyers.map((buyer, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-neutral-300 truncate">{buyer.name || 'Non spécifié'}</span>
                        <span className="text-yellow-500 font-mono">{buyer.count} marchés</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Winners */}
              {insights && (
                <div className="border border-neutral-800 p-6">
                  <h2 className="text-lg font-bold mb-4">🏆 Top Gagnants</h2>
                  <div className="space-y-3">
                    {insights.topWinners.map((winner, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-neutral-300 truncate">{winner.name || 'Non spécifié'}</span>
                        <span className="text-green-500 font-mono">{winner.count} victoires</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Attributions */}
            <div className="border border-neutral-800 p-6">
              <h2 className="text-lg font-bold mb-4">📋 Dernières Attributions</h2>
              <div className="space-y-4">
                {attributions.map(attr => (
                  <div key={attr.id} className="border-b border-neutral-800 pb-4 last:border-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-medium mb-1">
                          {attr.rfpTitle.length > 100 
                            ? attr.rfpTitle.substring(0, 100) + '...' 
                            : attr.rfpTitle}
                        </h3>
                        <div className="text-sm text-neutral-400">
                          <span>🏛️ {attr.buyerName || 'Acheteur non spécifié'}</span>
                          <span className="mx-2">•</span>
                          <span>📅 {new Date(attr.notificationDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-500 font-bold">{formatAmount(attr.amount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
