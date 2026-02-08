'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Download, Filter, TrendingUp, Clock, Building2, LogOut } from 'lucide-react';
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

// Mock data pour dev - sera remplacé par API
const MOCK_RFPS: RFP[] = [
  {
    id: '1',
    title: "Développement d'une plateforme numérique de gestion des démarches citoyennes",
    issuer: 'Mairie de Lyon',
    deadline: '2026-03-15',
    score: 85,
    scoreLabel: 'GO',
    budget: '150 000 €',
    region: 'Auvergne-Rhône-Alpes',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/26-12345',
    publishedAt: '2026-02-08',
  },
  {
    id: '2',
    title: "Refonte du système d'information RH",
    issuer: 'Conseil Départemental du Rhône',
    deadline: '2026-03-20',
    score: 72,
    scoreLabel: 'GO',
    budget: '280 000 €',
    region: 'Auvergne-Rhône-Alpes',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/26-12346',
    publishedAt: '2026-02-07',
  },
  {
    id: '3',
    title: "Maintenance applicative des outils métiers",
    issuer: 'CHU de Bordeaux',
    deadline: '2026-02-28',
    score: 58,
    scoreLabel: 'MAYBE',
    budget: '90 000 €',
    region: 'Nouvelle-Aquitaine',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/26-12347',
    publishedAt: '2026-02-06',
  },
  {
    id: '4',
    title: "Étude pour la mise en place d'un datacenter",
    issuer: 'Région Bretagne',
    deadline: '2026-04-01',
    score: 45,
    scoreLabel: 'MAYBE',
    budget: '500 000 €',
    region: 'Bretagne',
    source: 'TED',
    url: 'https://ted.europa.eu/notice/123456',
    publishedAt: '2026-02-05',
  },
  {
    id: '5',
    title: "Fourniture de licences Microsoft",
    issuer: 'Académie de Paris',
    deadline: '2026-02-20',
    score: 28,
    scoreLabel: 'PASS',
    budget: '1 200 000 €',
    region: 'Île-de-France',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/26-12348',
    publishedAt: '2026-02-04',
  },
];

function ScoreBadge({ score, label }: { score: number; label: 'GO' | 'MAYBE' | 'PASS' }) {
  const colors = {
    GO: 'bg-green-500 text-black',
    MAYBE: 'bg-yellow-500 text-black',
    PASS: 'bg-neutral-700 text-white',
  };
  
  return (
    <div className={`px-3 py-1 font-bold text-sm ${colors[label]}`}>
      {score}/100 • {label}
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

export default function DashboardPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [filter, setFilter] = useState<'all' | 'go' | 'maybe'>('all');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Fetch from API
    const fetchData = async () => {
      try {
        // Get email from localStorage (set during subscribe)
        const email = localStorage.getItem('lefilonao_email');
        if (!email) {
          // Redirect to subscribe if not logged in
          window.location.href = '/subscribe';
          return;
        }
        
        setUserEmail(email);
        
        const res = await fetch(
          `https://meragel.vercel.app/api/excalibur/dashboard?email=${encodeURIComponent(email)}`
        );
        
        if (!res.ok) {
          throw new Error('API error');
        }
        
        const data = await res.json();
        setRfps(data.rfps || []);
      } catch (error) {
        console.error('Failed to fetch RFPs:', error);
        // Fallback to mock data for demo
        setRfps(MOCK_RFPS);
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
    avgScore: Math.round(rfps.reduce((acc, r) => acc + r.score, 0) / rfps.length) || 0,
  };

  const exportCSV = () => {
    const headers = ['Titre', 'Émetteur', 'Score', 'Budget', 'Deadline', 'Région', 'URL'];
    const rows = filteredRfps.map(r => [
      r.title,
      r.issuer,
      `${r.score}/100`,
      r.budget || '',
      r.deadline || '',
      r.region || '',
      r.url,
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lefilonao-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

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
              <Link href="/dashboard" className="text-yellow-500 font-medium">Mes AO</Link>
              <Link href="/dashboard/market" className="text-neutral-400 hover:text-white">Market Intel 🎯</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400 text-sm">{userEmail}</span>
            <button className="p-2 hover:bg-neutral-800 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-neutral-800 p-6">
            <div className="text-neutral-400 text-sm mb-1">Appels d'offres</div>
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="text-neutral-500 text-sm">cette semaine</div>
          </div>
          <div className="border border-neutral-800 p-6">
            <div className="text-neutral-400 text-sm mb-1">Opportunités GO</div>
            <div className="text-3xl font-black text-green-500">{stats.go}</div>
            <div className="text-neutral-500 text-sm">score ≥70</div>
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
                      {isUrgent && (
                        <span className="text-xs text-red-500 bg-red-950 px-2 py-1 font-medium">
                          ⚠️ {daysLeft}j restants
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
                          📍 {rfp.region}
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
                    Voir l'AO
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRfps.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            Aucun appel d'offres ne correspond à vos critères.
          </div>
        )}
      </div>
    </div>
  );
}
