'use client';

import { FileText, Download, Archive, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { useDceDocuments, type DceDocument } from '@/hooks/useDceDocuments';
import { categoryLabel, categoryColor, type DceCategory } from '@/lib/dce-categorize';

interface DceDocumentHubProps {
  noticeId: string;
  dceUrl: string | null | undefined;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function CategoryBadge({ category }: { category: DceCategory }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${categoryColor(category)}`}>
      {categoryLabel(category)}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 animate-pulse">
      <div className="skeleton w-12 h-5 rounded" />
      <div className="skeleton flex-1 h-4 rounded" />
      <div className="skeleton w-14 h-4 rounded" />
      <div className="skeleton w-8 h-8 rounded" />
    </div>
  );
}

function DocumentRow({
  doc,
  isDownloading,
  onDownload,
}: {
  doc: DceDocument;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors group">
      <CategoryBadge category={doc.category} />
      <span className="flex-1 text-sm text-slate-700 truncate" title={doc.filename}>
        {doc.filename}
      </span>
      <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
        {formatSize(doc.file_size)}
      </span>
      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
        title="Telecharger"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function DceDocumentHub({ noticeId, dceUrl }: DceDocumentHubProps) {
  const {
    documents,
    discoveryState,
    downloadingIds,
    downloadDocument,
    downloadAll,
    retryDiscovery,
    isZipping,
  } = useDceDocuments(noticeId, dceUrl);

  // Don't render if no DCE URL and no documents
  if (!dceUrl && discoveryState === null) return null;
  if (discoveryState === 'no_url' && documents.length === 0) return null;

  const hasCachedDocs = documents.some((d) => d.r2_key);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            Documents du DCE
            {discoveryState === 'done' && documents.length > 0 && (
              <span className="ml-1.5 text-slate-400 font-normal">({documents.length})</span>
            )}
          </h2>
        </div>
        {documents.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={isZipping}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creation du ZIP...
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                Telecharger tout
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-2 py-2">
        {/* Discovering state */}
        {discoveryState === 'discovering' && (
          <div className="space-y-1">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <p className="text-xs text-slate-400 text-center py-2">
              Recherche des documents en cours...
            </p>
          </div>
        )}

        {/* Documents list */}
        {discoveryState === 'done' && documents.length > 0 && (
          <div className="divide-y divide-slate-50">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isDownloading={downloadingIds.has(doc.id)}
                onDownload={() => downloadDocument(doc.id, doc.filename)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {discoveryState === 'done' && documents.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-3">Aucun document trouve automatiquement</p>
            {dceUrl && (
              <a
                href={dceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir sur le profil acheteur
              </a>
            )}
          </div>
        )}

        {/* Error state */}
        {discoveryState === 'failed' && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-3">La recherche de documents a echoue</p>
            <button
              onClick={retryDiscovery}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reessayer
            </button>
          </div>
        )}
      </div>

      {/* Footer — link to profil acheteur */}
      {dceUrl && discoveryState === 'done' && documents.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <a
            href={dceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Voir sur le profil acheteur
          </a>
        </div>
      )}
    </div>
  );
}
