'use client';

import { FileCheck, AlertTriangle, XCircle, Clock, Download, Trash2, RefreshCw } from 'lucide-react';
import type { ProfileDocument } from '@/lib/dev';
import FileUploadZone from '@/components/shared/FileUploadZone';
import { formatFileSize } from '@/lib/file-storage';

interface AdminDocumentsCardProps {
  documents: ProfileDocument[];
  onUpload: (docName: string, file: File) => Promise<void>;
  onDownload: (docName: string) => void;
  onDelete: (docName: string) => void;
}

const STATUS_CONFIG = {
  valid: { badge: 'doc-status-valid', label: 'Valide', icon: FileCheck },
  expiring: { badge: 'doc-status-expiring', label: 'Expire bientot', icon: Clock },
  expired: { badge: 'doc-status-expired', label: 'Expire', icon: XCircle },
  missing: { badge: 'doc-status-missing', label: 'Manquant', icon: AlertTriangle },
} as const;

function formatExpiry(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDocumentsCard({ documents, onUpload, onDownload, onDelete }: AdminDocumentsCardProps) {
  const validCount = documents.filter((d) => d.status === 'valid' || d.status === 'expiring').length;
  const totalCount = documents.length;
  const pct = totalCount > 0 ? Math.round((validCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Documents administratifs</h2>
            <p className="text-xs text-slate-400">{validCount}/{totalCount} documents a jour</p>
          </div>
        </div>
        <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-3">
        {documents.map((doc) => {
          const config = STATUS_CONFIG[doc.status];
          const Icon = config.icon;
          const hasFile = !!doc.fileId;

          return (
            <div key={doc.name} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={config.badge}>
                    <Icon className="w-3 h-3" /> {config.label}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 block truncate">{doc.name}</span>
                    {doc.expiresAt && (
                      <span className="text-xs text-slate-400">Expire le {formatExpiry(doc.expiresAt)}</span>
                    )}
                  </div>
                </div>

                {hasFile && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onDownload(doc.name)}
                      className="p-1.5 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Telecharger"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.name)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {hasFile && doc.fileName ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-1.5">
                  <FileCheck className="w-3 h-3 text-emerald-500" />
                  <span className="truncate">{doc.fileName}</span>
                  {doc.fileSize && <span>&middot; {formatFileSize(doc.fileSize)}</span>}
                  <button
                    onClick={() => onDelete(doc.name)}
                    className="ml-auto text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Remplacer
                  </button>
                </div>
              ) : (
                <FileUploadZone
                  onUpload={(file) => onUpload(doc.name, file)}
                  compact
                  label="Glissez un fichier ou cliquez"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
