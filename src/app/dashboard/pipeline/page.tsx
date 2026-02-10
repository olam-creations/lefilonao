'use client';

import { motion } from 'framer-motion';
import { Kanban, Info, Plus } from 'lucide-react';
import TopBar from '@/components/dashboard/TopBar';
import PipelineBoard from '@/components/dashboard/pipeline/PipelineBoard';
import { stagger, fadeUp } from '@/lib/motion-variants';

export default function PipelinePage() {
  return (
    <div className="animate-fade-in flex flex-col h-full">
      <TopBar 
        title="Pipeline CRM" 
        description="Gérez vos candidatures de la détection à la signature."
        icon={<Kanban className="w-6 h-6 text-indigo-600" />}
      />

      {/* Info Banner */}
      <motion.div 
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3"
      >
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 flex-shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-900">Conseil Expert</h3>
          <p className="text-sm text-indigo-700/80 leading-relaxed">
            Ajoutez les appels d&apos;offres qui vous intéressent depuis l&apos;onglet <strong>Opportunités</strong> pour commencer à les suivre dans votre pipeline.
          </p>
        </div>
      </motion.div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0">
        <PipelineBoard />
      </div>
    </div>
  );
}
