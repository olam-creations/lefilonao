'use client';

import { X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureLabel: string;
}

export default function UpgradeModal({ open, onClose, featureLabel }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-8 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-5 shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Fonctionnalité Pro
              </h2>
              <p className="text-slate-500 mb-6">
                <strong>{featureLabel}</strong> est disponible avec l&apos;abonnement Pro.
                Débloquez toutes les fonctionnalités avancées.
              </p>

              <Link
                href="/pricing"
                className="btn-primary w-full justify-center py-3 text-base"
                onClick={onClose}
              >
                Voir les offres
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={onClose}
                className="w-full text-sm text-slate-400 hover:text-slate-600 mt-3 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
