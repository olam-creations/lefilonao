'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Check } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug', label: 'Bug', emoji: '🐛' },
  { value: 'idea', label: 'Idée', emoji: '💡' },
  { value: 'other', label: 'Autre', emoji: '💬' },
] as const;

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const getEmail = (): string => {
    try {
      const raw = localStorage.getItem('lefilonao_token');
      if (!raw) return 'anonymous';
      const payload = JSON.parse(atob(raw.split('.')[1]));
      return payload.email ?? 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: getEmail(),
          category,
          message: message.trim(),
          pageUrl: window.location.pathname,
        }),
      });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setMessage('');
        setCategory('idea');
      }, 1500);
    } catch {
      // Silently fail — non-critical feature
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Donner votre feedback"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquarePlus className="w-5 h-5" />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-20 right-5 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-900">Merci !</p>
                <p className="text-xs text-slate-400 mt-1">Votre retour a bien été envoyé.</p>
              </div>
            ) : (
              <>
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Votre feedback</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">En tant que Fondateur, votre avis compte.</p>
                </div>

                {/* Category pills */}
                <div className="flex gap-1.5 px-4 pb-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        category === cat.value
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-50 text-slate-500 border border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div className="px-4 pb-3">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre retour..."
                    maxLength={2000}
                    rows={4}
                    className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none placeholder:text-slate-300"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-300">{message.length}/2000</span>
                    <button
                      onClick={handleSubmit}
                      disabled={!message.trim() || sending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3 h-3" />
                      {sending ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
