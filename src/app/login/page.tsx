'use client';

import { Suspense, useState, useEffect } from 'react';
import { ArrowRight, Mail, AlertCircle, Code } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, isAuthenticated, getRedirectAfterLogin, exchangeSession } from '@/lib/auth';
import { isDevMode, createDevToken } from '@/lib/dev';
import Header from '@/components/Header';

type Status = 'idle' | 'loading' | 'success' | 'not-found' | 'unavailable' | 'error';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(isDevMode());
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      const token = getToken();
      if (token) {
        // Ensure session cookie exists before redirecting
        exchangeSession(token).finally(() => {
          window.location.href = '/dashboard';
        });
      } else {
        window.location.href = '/dashboard';
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');

    try {
      const res = await api.login(email.trim());

      if (res.status === 404) {
        setStatus('unavailable');
        return;
      }

      if (res.status === 401 || res.status === 422) {
        setStatus('not-found');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        return;
      }

      const data = await res.json();
      if (data.token) {
        await exchangeSession(data.token);
        const redirect = searchParams.get('redirect') || getRedirectAfterLogin();
        window.location.href = redirect || '/dashboard';
      } else {
        setStatus('success');
      }
    } catch {
      setStatus('error');
    }
  };

  const messages: Record<string, { text: string; type: 'info' | 'error' | 'warning' }> = {
    'not-found': {
      text: 'Aucun compte trouvé avec cet email. Vérifiez l\'adresse ou inscrivez-vous.',
      type: 'error',
    },
    'unavailable': {
      text: 'La connexion sera bientôt disponible. En attendant, contactez contact@lefilonao.com.',
      type: 'warning',
    },
    'error': {
      text: 'Une erreur est survenue. Réessayez dans quelques instants.',
      type: 'error',
    },
    'success': {
      text: 'Un lien de connexion a été envoyé à votre adresse email.',
      type: 'info',
    },
  };

  const message = status !== 'idle' && status !== 'loading' ? messages[status] : null;

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

          {message && (
            <div className={`mt-4 flex items-start gap-2.5 text-sm rounded-xl p-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
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
            onClick={async () => {
              const token = createDevToken();
              await exchangeSession(token);
              window.location.href = searchParams.get('redirect') || '/dashboard';
            }}
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
              <Mail className="w-6 h-6" />
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
