'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Download, TrendingUp, Clock, Building2, LogOut } from 'lucide-react';
import Link from 'next/link';

interface RFP {
  id: string;
  title: string;
  issuer: string;
  deadline: string | null;
  score: number;
  scoreLabel: 'GO' | 'MAYBE' | 'PASS';
  budget: string | null;
  region: string | null;
  source: string;
  url: string;
  publishedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://meragel.vercel.app';

function ScoreBadge({ score, label }: { score: number; label: 'GO' | 'MAYBE' | 'PASS' }) {
  const colors = {
    GO: 'bg-green-500 text-black',
    MAYBE: 'bg-yellow-500 text-black',
    PASS: 'bg-neutral-700 text-white',
  };

  return (
    <div className={`px-3 py-1 font-bold text-sm ${colors[label]}`}>
      {score}/100 - {label}
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Non spécifié';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const deadline = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

/** Sanitize CSV cell to prevent formula injection */
function sanitizeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `'${escaped}`;
  }
  return escaped;
}

function handleLogout() {
  localStorage.removeItem('lefilonao_token');
  window.location.href = '/';
}

export default function DashboardPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [filter, setFilter] = useState<'all' | 'go' | 'maybe'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('lefilonao_token');
        if (!token) {
          window.location.href = '/subscribe';
          return;
        }

        const res = await fetch(`${API_URL}/api/excalibur/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('lefilonao_token');
          window.location.href = '/subscribe';
          return;
        }

        if (!res.ok) {
          throw new Error('API error');
        }

        const data = await res.json();
        setRfps(data.rfps || []);
      } catch {
        setError('Impossible de charger les données. Réessayez plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRfps = rfps.filter(rfp => {
    if (filter === 'go') return rfp.scoreLabel === 'GO';
    if (filter === 'maybe') return rfp.scoreLabel === 'MAYBE' || rfp.scoreLabel === 'GO';
    return true;
  });

  const stats = {
    total: rfps.length,
    go: rfps.filter(r => r.scoreLabel === 'GO').length,
    avgScore: rfps.length > 0 ? Math.round(rfps.reduce((acc, r) => acc + r.score, 0) / rfps.length) : 0,
  };

  const exportCSV = () => {
    const headers = ['Titre', 'Emetteur', 'Score', 'Budget', 'Deadline', 'Region', 'URL'];
    const rows = filteredRfps.map(r => [
      sanitizeCsvCell(r.title),
      sanitizeCsvCell(r.issuer),
      `${r.score}/100`,
      sanitizeCsvCell(r.budget || ''),
      r.deadline || '',
      sanitizeCsvCell(r.region || ''),
      sanitizeCsvCell(r.url),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lefilonao-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-black">
            <span className="text-yellow-500">Le Filon</span> AO
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-neutral-800 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-neutral-800 p-6">
            <div className="text-neutral-400 text-sm mb-1">Appels d&apos;offres</div>
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="text-neutral-500 text-sm">cette semaine</div>
          </div>
          <div className="border border-neutral-800 p-6">
            <div className="text-neutral-400 text-sm mb-1">Opportunités GO</div>
            <div className="text-3xl font-black text-green-500">{stats.go}</div>
            <div className="text-neutral-500 text-sm">score &ge;70</div>
          </div>
          <div className="border border-neutral-800 p-6">
            <div className="text-neutral-400 text-sm mb-1">Score moyen</div>
            <div className="text-3xl font-black text-yellow-500">{stats.avgScore}</div>
            <div className="text-neutral-500 text-sm">sur 100</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'all' ? 'bg-white text-black' : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              Tous ({rfps.length})
            </button>
            <button
              onClick={() => setFilter('go')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'go' ? 'bg-green-500 text-black' : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              GO uniquement
            </button>
            <button
              onClick={() => setFilter('maybe')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'maybe' ? 'bg-yellow-500 text-black' : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              GO + À étudier
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* RFP List */}
        <div className="space-y-4">
          {filteredRfps.map(rfp => {
            const daysLeft = daysUntil(rfp.deadline);
            const isUrgent = daysLeft !== null && daysLeft <= 7;

            return (
              <div
                key={rfp.id}
                className={`border p-6 transition-colors hover:border-neutral-600 ${
                  isUrgent ? 'border-red-900 bg-red-950/20' : 'border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <ScoreBadge score={rfp.score} label={rfp.scoreLabel} />
                      <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-1">
                        {rfp.source}
                      </span>
                      {isUrgent && daysLeft !== null && (
                        <span className="text-xs text-red-500 bg-red-950 px-2 py-1 font-medium">
                          {daysLeft}j restants
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold mb-2">{rfp.title}</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {rfp.issuer}
                      </div>
                      {rfp.budget && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {rfp.budget}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Deadline: {formatDate(rfp.deadline)}
                      </div>
                      {rfp.region && (
                        <div className="text-neutral-500">
                          {rfp.region}
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={rfp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors whitespace-nowrap"
                  >
                    Voir l&apos;AO
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRfps.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            Aucun appel d&apos;offres ne correspond à vos critères.
          </div>
        )}
      </div>
    </div>
  );
}
