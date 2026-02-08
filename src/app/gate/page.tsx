'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GateForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Accès refusé');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-3 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          className="w-full p-3 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
      >
        {loading ? 'Vérification...' : 'Accéder'}
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black">
            <span className="text-yellow-500">Le Filon</span> AO
          </h1>
          <p className="text-neutral-500 mt-2">Accès restreint — staging</p>
        </div>
        <Suspense>
          <GateForm />
        </Suspense>
      </div>
    </div>
  );
}
