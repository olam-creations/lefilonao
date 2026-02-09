'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface DceDropZoneProps {
  state: 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';
  progress: { step: string; percent: number };
  error: string | null;
  onDrop: (file: File) => void;
  onReset: () => void;
  onOpenFilePicker?: () => void;
}

export default function DceDropZone({ state, progress, error, onDrop, onReset, onOpenFilePicker }: DceDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        onDrop(file);
      }
    }
  }, [onDrop]);

  useEffect(() => {
    if (state !== 'idle' && state !== 'error') return;

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [state, handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onDrop(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onDrop]);

  const handleOpenFilePicker = useCallback(() => {
    if (onOpenFilePicker) {
      onOpenFilePicker();
    } else {
      fileInputRef.current?.click();
    }
  }, [onOpenFilePicker]);

  const isVisible = isDragOver || state === 'uploading' || state === 'analyzing' || state === 'done' || state === 'error';

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Choisir un fichier DCE"
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl"
          >
            {(state === 'done' || state === 'error') && (
              <button
                onClick={onReset}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-lg mx-4"
            >
              <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-8 text-center">
                {/* Drag over state */}
                {isDragOver && state === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"
                    >
                      <Upload className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">Deposez votre DCE ici</h3>
                    <p className="text-sm text-white/60">Format PDF uniquement (max 20 Mo)</p>
                  </motion.div>
                )}

                {/* Uploading state */}
                {state === 'uploading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Envoi du fichier...</h3>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress.percent}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Analyzing state */}
                {state === 'analyzing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">Analyse IA en cours</h3>
                      <motion.p
                        key={progress.step}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-white/60"
                      >
                        {progress.step}
                      </motion.p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        animate={{ width: `${progress.percent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Done state */}
                {state === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-white">Analyse terminee !</h3>
                    <p className="text-sm text-white/60">
                      Le DCE a ete analyse avec succes. Les donnees ont ete injectees dans votre dossier.
                    </p>
                    <button
                      onClick={onReset}
                      className="mt-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all"
                    >
                      Voir les resultats
                    </button>
                  </motion.div>
                )}

                {/* Error state */}
                {state === 'error' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Erreur d&apos;analyse</h3>
                    <p className="text-sm text-white/60">{error}</p>
                    <button
                      onClick={onReset}
                      className="mt-2 px-6 py-2.5 bg-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-all"
                    >
                      Reessayer
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
