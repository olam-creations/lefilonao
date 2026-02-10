'use client';

import { Suspense, useState, useEffect } from 'react';
import { ArrowRight, Lock, AlertCircle, Code } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getRedirectAfterLogin, clearAuthCache } from '@/lib/auth';
import { isDevMode } from '@/lib/dev';
import Header from '@/components/Header';

type Status = 'idle' | 'loading' | 'error' | 'needs-migration';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(isDevMode());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await api.login(email.trim(), password);
      const data = await res.json();

      if (!res.ok) {
        if (data.needsMigration) {
          setStatus('needs-migration');
          setErrorMsg('Ce compte n\'a pas encore de mot de passe. Inscrivez-vous pour en créer un.');
          return;
        }
        setStatus('error');
        setErrorMsg(data.error || 'Email ou mot de passe incorrect');
        return;
      }

      clearAuthCache();
      const redirect = searchParams.get('redirect') || getRedirectAfterLogin();
      window.location.href = redirect || '/dashboard';
    } catch {
      setStatus('error');
      setErrorMsg('Une erreur est survenue. Réessayez dans quelques instants.');
    }
  };

  const handleDevLogin = async () => {
    setStatus('loading');
    try {
      await api.login('dev@lefilonao.com', 'dev');
      clearAuthCache();
      window.location.href = searchParams.get('redirect') || '/dashboard';
    } catch {
      setStatus('error');
      setErrorMsg('Erreur dev login');
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
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
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />

          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2 mt-4">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />

          {(status === 'error' || status === 'needs-migration') && errorMsg && (
            <div className={`mt-4 flex items-start gap-2.5 text-sm rounded-xl p-3 ${
              status === 'needs-migration'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !email.trim() || !password.trim()}
            className="btn-primary w-full justify-center py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Connexion...' : 'Se connecter'}
            {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <p className="text-center text-slate-400 text-sm mt-6">
        Pas encore de compte ?{' '}
        <Link href="/subscribe" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          S&apos;inscrire gratuitement
        </Link>
      </p>

      {isDev && (
        <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
          <button
            onClick={handleDevLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Code className="w-4 h-4" />
            Accès Dev (données fictives)
          </button>
          <p className="text-center text-slate-300 text-xs mt-2">
            Visible uniquement en localhost
          </p>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header variant="public" />

      <div className="flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-indigo-500/25">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Connexion
            </h1>
            <p className="text-slate-500">
              Accédez à votre tableau de bord Le Filon AO
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
