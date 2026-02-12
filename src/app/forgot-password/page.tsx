'use client';

import { useState } from 'react';
import { ArrowRight, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { forgotPassword } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const result = await forgotPassword(email.trim());

      if (result.error) throw new Error(result.error);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="public" />

      <div className="flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-5">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Mot de passe oublié
            </h1>
            <p className="text-slate-500">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            {status === 'success' ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Email envoyé !</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Vérifiez votre boîte de réception (et vos spams). Le lien est valide 1 heure.
                </p>
                <Link href="/login" className="btn-secondary w-full justify-center">
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

                {status === 'error' && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary w-full justify-center py-3 mt-6 disabled:opacity-50"
                >
                  {status === 'loading' ? 'Envoi...' : 'Envoyer le lien'}
                  {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
