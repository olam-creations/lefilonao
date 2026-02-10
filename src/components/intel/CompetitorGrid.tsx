'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, Search } from 'lucide-react';
import CompetitorCard from './CompetitorCard';

interface CompetitorData {
  name: string;
  siret: string;
  totalWins: number;
  totalVolume: number;
  avgContract: number;
  winRate: number | null;
  topBuyers: { name: string; count: number }[];
  sectors: { code: string; count: number }[];
  regions: { name: string; count: number }[];
  commonBuyers: number;
  threatLevel: 'high' | 'medium' | 'low';
}

export default function CompetitorGrid() {
  const [search, setSearch] = useState('');
  const [competitor, setCompetitor] = useState<CompetitorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!search.trim() || loading) return;
    setLoading(true);
    setError(null);
    setCompetitor(null);

    const params = /^\d{9,14}$/.test(search.trim())
      ? `siret=${encodeURIComponent(search.trim())}`
      : `name=${encodeURIComponent(search.trim())}`;

    fetch(`/api/intel/competitor-card?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.competitor) setCompetitor(data.competitor);
        else setError('Aucun concurrent trouve');
      })
      .catch(() => setError('Erreur de connexion'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Suivi concurrents</h3>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Nom ou SIRET du concurrent..."
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !search.trim()}
          className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 text-center py-2">{error}</p>}

      {competitor && <CompetitorCard data={competitor} />}

      {!competitor && !loading && !error && (
        <p className="text-xs text-slate-400 text-center py-6">
          Recherchez un concurrent par nom ou SIRET
        </p>
      )}
    </div>
  );
}
