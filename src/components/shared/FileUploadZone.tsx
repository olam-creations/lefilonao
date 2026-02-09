'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { validateFile } from '@/lib/file-storage';

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
  label?: string;
  compact?: boolean;
}

type UploadState = 'idle' | 'dragover' | 'uploading' | 'done' | 'error';

export default function FileUploadZone({
  onUpload,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  label = 'Glissez un fichier ou cliquez pour uploader',
  compact = false,
}: FileUploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMsg(error);
      setState('error');
      return;
    }

    setState('uploading');
    setErrorMsg('');
    try {
      await onUpload(file);
      setState('done');
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      setState('error');
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  const borderClass = {
    idle: 'border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30',
    dragover: 'border-dashed border-indigo-400 bg-indigo-50/50 shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
    uploading: 'border-solid border-indigo-200 bg-indigo-50/20',
    done: 'border-solid border-emerald-300 bg-emerald-50/30',
    error: 'border-solid border-red-300 bg-red-50/30',
  }[state];

  const iconMap = {
    idle: <Upload className="w-4 h-4 text-slate-400" />,
    dragover: <Upload className="w-4 h-4 text-indigo-500" />,
    uploading: <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />,
    done: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  const textMap: Record<UploadState, string> = {
    idle: label,
    dragover: 'Relacher pour uploader',
    uploading: 'Upload en cours...',
    done: 'Upload reussi',
    error: errorMsg || 'Erreur',
  };

  return (
    <div
      className={`relative border-2 rounded-xl transition-all duration-200 cursor-pointer ${borderClass} ${
        compact ? 'p-2' : 'p-4'
      }`}
      onDragOver={(e) => { e.preventDefault(); setState('dragover'); }}
      onDragLeave={() => setState('idle')}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <div className={`flex items-center gap-2 ${compact ? '' : 'justify-center'}`}>
        {iconMap[state]}
        <span className={`text-xs ${
          state === 'error' ? 'text-red-500' :
          state === 'done' ? 'text-emerald-600' :
          'text-slate-400'
        }`}>
          {textMap[state]}
        </span>
      </div>
    </div>
  );
}
