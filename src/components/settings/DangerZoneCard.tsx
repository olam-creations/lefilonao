'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { fadeUp } from '@/lib/motion-variants';

interface Props {
  email: string;
}

export default function DangerZoneCard({ email }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Fetch server-side data (Supabase)
      const res = await fetch('/api/settings/export');
      if (!res.ok) throw new Error('Export échoué');
      const serverData = await res.json();

      // Merge with client-side localStorage data
      const localData: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lefilonao_')) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key) ?? '');
          } catch {
            localData[key] = localStorage.getItem(key);
          }
        }
      }
      serverData.localStorage = localData;

      const blob = new Blob([JSON.stringify(serverData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lefilonao-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (confirmText !== 'SUPPRIMER') return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/settings/account?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur de suppression');

      // Clear all localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lefilonao_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
      setDeleting(false);
    }
  }, [email, confirmText]);

  return (
    <motion.section
      variants={fadeUp}
      className="bg-white rounded-xl border border-red-200 p-6"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-semibold text-slate-900">Zone de danger</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">Actions irréversibles sur votre compte</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Export */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-900">Exporter mes données</p>
            <p className="text-xs text-slate-500">
              Téléchargez toutes vos données au format JSON
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Exporter'}
          </button>
        </div>

        {/* Delete account */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Supprimer mon compte</p>
              <p className="text-xs text-red-600">
                Cette action est irréversible. Toutes vos données seront supprimées.
              </p>
            </div>
            {!showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
          </div>

          {showConfirm && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-red-800">
                Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression de votre compte :
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'SUPPRIMER' || deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Suppression...' : 'Confirmer la suppression'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText('');
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
