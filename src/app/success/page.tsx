'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-4xl font-black mb-4">
          Bienvenue dans <span className="text-yellow-500">Le Filon</span> !
        </h1>
        
        <p className="text-xl text-neutral-300 mb-6">
          Votre abonnement est activé. Vous allez recevoir vos premières alertes très bientôt.
        </p>
        
        <div className="bg-neutral-900 border border-neutral-800 p-6 mb-8 text-left">
          <h2 className="font-bold mb-4">Prochaines étapes :</h2>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 font-bold">1.</span>
              <span>Vérifiez votre email de confirmation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 font-bold">2.</span>
              <span>Configurez vos alertes (secteurs, régions, budget)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 font-bold">3.</span>
              <span>Recevez les appels d'offres qui matchent votre profil</span>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/subscribe"
            className="px-6 py-3 bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
          >
            Modifier mon profil <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="mailto:contact@lefilonao.com"
            className="px-6 py-3 border border-neutral-700 font-bold hover:border-white transition-colors"
          >
            Une question ?
          </a>
        </div>
        

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Chargement...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
