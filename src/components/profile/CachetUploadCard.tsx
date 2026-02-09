'use client';

import { useRef, useState } from 'react';
import { Stamp, Upload, Pencil, Trash2, AlertCircle } from 'lucide-react';

interface CachetUploadCardProps {
  cachetBase64: string | undefined;
  onSave: (base64: string | undefined) => void;
}

const MAX_SIZE_BYTES = 500 * 1024; // 500 KB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

export default function CachetUploadCard({ cachetBase64, onSave }: CachetUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format invalide. Seuls PNG et JPG sont acceptes.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Fichier trop volumineux (max 500 Ko).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        onSave(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    setError(null);
    onSave(undefined);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Stamp className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-900">Cachet de l&apos;entreprise</h2>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Image du cachet integree automatiquement dans les PDF DC1/DC2.
      </p>

      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {cachetBase64 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src={cachetBase64}
              alt="Cachet de l'entreprise"
              className="max-w-[160px] max-h-[160px] object-contain"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer"
        >
          <Upload className="w-8 h-8" />
          <span className="text-sm font-medium">Cliquez pour importer votre cachet</span>
          <span className="text-xs">PNG ou JPG, max 500 Ko</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
