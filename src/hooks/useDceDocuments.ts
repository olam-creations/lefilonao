'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DceCategory } from '@/lib/dce-categorize';

export interface DceDocument {
  id: string;
  notice_id: string;
  original_url: string;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  category: DceCategory;
  r2_key: string | null;
  cached_at: string | null;
  discovery_status: 'listed' | 'downloading' | 'cached' | 'failed';
  created_at: string;
}

export type DiscoveryState = null | 'pending' | 'discovering' | 'done' | 'failed' | 'no_url';

interface UseDceDocumentsReturn {
  documents: DceDocument[];
  discoveryState: DiscoveryState;
  downloadingIds: Set<string>;
  downloadDocument: (docId: string, filename: string) => Promise<void>;
  downloadAll: () => Promise<void>;
  retryDiscovery: () => Promise<void>;
  isZipping: boolean;
}

export function useDceDocuments(noticeId: string, dceUrl: string | null | undefined): UseDceDocumentsReturn {
  const [documents, setDocuments] = useState<DceDocument[]>([]);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const discoveryTriggered = useRef(false);

  // Fetch existing documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/dce-documents?notice_id=${encodeURIComponent(noticeId)}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
        setDiscoveryState(data.discovery_status);
        return data.discovery_status as DiscoveryState;
      }
    } catch {
      // Fetch failed
    }
    return null;
  }, [noticeId]);

  // Trigger discovery
  const triggerDiscovery = useCallback(async () => {
    setDiscoveryState('discovering');
    try {
      const res = await fetch('/api/dce-documents/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_id: noticeId }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
        setDiscoveryState(data.discovery_status ?? 'done');
      } else {
        setDiscoveryState('failed');
      }
    } catch {
      setDiscoveryState('failed');
    }
  }, [noticeId]);

  // Auto-trigger discovery on mount if not yet done
  useEffect(() => {
    if (discoveryTriggered.current) return;
    discoveryTriggered.current = true;

    const init = async () => {
      const status = await fetchDocuments();

      // If no status or pending (reset by migration), trigger discovery
      if ((status === null || status === 'pending') && dceUrl && !dceUrl.includes('boamp.fr')) {
        await triggerDiscovery();
      }
    };

    init();
  }, [fetchDocuments, triggerDiscovery, dceUrl]);

  // Download a single document
  const downloadDocument = useCallback(async (docId: string, filename: string) => {
    setDownloadingIds((prev) => new Set([...prev, docId]));
    try {
      const res = await fetch(`/api/dce-documents/${docId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        // Refresh document list to get updated cache status
        await fetchDocuments();
      }
    } catch {
      // Download failed
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, [fetchDocuments]);

  // Download all as ZIP
  const downloadAll = useCallback(async () => {
    setIsZipping(true);
    try {
      // First download all uncached documents to cache them
      const uncached = documents.filter((d) => !d.r2_key);
      for (const doc of uncached) {
        try {
          await fetch(`/api/dce-documents/${doc.id}/download`);
        } catch {
          // Skip failed
        }
      }

      // Then request ZIP
      const res = await fetch('/api/dce-documents/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_id: noticeId }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DCE_${noticeId}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }

      await fetchDocuments();
    } catch {
      // ZIP failed
    } finally {
      setIsZipping(false);
    }
  }, [documents, noticeId, fetchDocuments]);

  // Retry discovery
  const retryDiscovery = useCallback(async () => {
    discoveryTriggered.current = false;
    await triggerDiscovery();
  }, [triggerDiscovery]);

  return {
    documents,
    discoveryState,
    downloadingIds,
    downloadDocument,
    downloadAll,
    retryDiscovery,
    isZipping,
  };
}
