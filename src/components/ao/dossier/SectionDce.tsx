'use client';

import { useState } from 'react';
import { useDceDocuments, type DceDocument } from '@/hooks/useDceDocuments';
import InlinePdfViewer from './InlinePdfViewer';
import DceExtractedData from './DceExtractedData';
import type { AoDetail } from '@/lib/dev';

interface SectionDceProps {
  noticeId: string;
  dceUrl: string | null | undefined;
  analysis: AoDetail | null;
}

export default function SectionDce({ noticeId, dceUrl, analysis }: SectionDceProps) {
  const { documents } = useDceDocuments(noticeId, dceUrl);
  const [selectedDoc, setSelectedDoc] = useState<DceDocument | null>(null);

  // Only show PDF viewer section when there are cached docs to view inline
  const viewableDocs = documents.filter((d) => d.r2_key && d.mime_type === 'application/pdf');

  if (viewableDocs.length === 0 && !analysis?.extractedEntities && !analysis?.extractedTables) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Inline PDF viewer for selected document */}
      {viewableDocs.length > 0 && (
        <div>
          {!selectedDoc && (
            <div className="flex flex-wrap gap-2">
              {viewableDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors truncate max-w-[200px]"
                  title={doc.filename}
                >
                  {doc.filename}
                </button>
              ))}
            </div>
          )}

          {selectedDoc && (
            <InlinePdfViewer
              url={`/api/dce-documents/${selectedDoc.id}/download`}
              filename={selectedDoc.filename}
              onClose={() => setSelectedDoc(null)}
            />
          )}
        </div>
      )}

      {/* Extracted data from analysis */}
      <DceExtractedData
        entities={analysis?.extractedEntities}
        tables={analysis?.extractedTables}
      />
    </div>
  );
}
