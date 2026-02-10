'use client';

import { useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ShieldCheck } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

interface Props {
  clientSecret: string;
  onClose: () => void;
}

export default function StripeCheckoutModal({ clientSecret, onClose }: Props) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Finaliser votre abonnement</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Plan Pro Fondateur &mdash; 25&euro;/mois
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200/80 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Stripe Embedded Checkout */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout className="stripe-embed" />
            </EmbeddedCheckoutProvider>
          </div>

          {/* Footer — trust badges */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80">
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Paiement sécurisé
              </span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Chiffrement SSL
              </span>
              <span className="w-px h-3 bg-slate-200" />
              <span>Annulable à tout moment</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
