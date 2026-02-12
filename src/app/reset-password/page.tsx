'use client';

import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { updatePassword } from '@/app/auth/actions';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const result = await updatePassword(password);

      if (result.error) throw new Error(result.error);

      router.push('/dashboard');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Erreur lors de la mise à jour.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="public" />

      <div className="flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-slate-500">
              Choisissez un nouveau mot de passe sécurisé.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <form onSubmit={handleSubmit}>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Nouveau mot de passe (8+ caractères)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                required
                minLength={8}
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
                {status === 'loading' ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
