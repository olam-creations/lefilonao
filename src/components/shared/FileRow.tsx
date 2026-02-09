'use client';

import { FileText, Image, File, Download, Trash2 } from 'lucide-react';
import { formatFileSize } from '@/lib/file-storage';

interface FileRowProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  onDownload: () => void;
  onDelete: () => void;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

function formatUploadDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FileRow({ fileName, fileSize, mimeType, uploadedAt, onDownload, onDelete }: FileRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 group">
      <FileIcon mimeType={mimeType} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
        <p className="text-xs text-slate-400">
          {formatFileSize(fileSize)} &middot; {formatUploadDate(uploadedAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="p-1.5 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
          title="Telecharger"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
