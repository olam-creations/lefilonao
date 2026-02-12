'use client';

import { Table, Tag } from 'lucide-react';
import type { ExtractedEntities } from '@/lib/dev';

interface DceExtractedDataProps {
  entities?: ExtractedEntities;
  tables?: { headers: string[]; rows: string[][]; pageNumber: number }[];
}

export default function DceExtractedData({ entities, tables }: DceExtractedDataProps) {
  const hasEntities = entities && (
    entities.cpvCodes.length > 0 ||
    entities.budgetAmounts.length > 0 ||
    entities.contacts.length > 0
  );
  const hasTables = tables && tables.length > 0;

  if (!hasEntities && !hasTables) return null;

  return (
    <div className="space-y-4 mt-4">
      {/* Extracted entities */}
      {hasEntities && entities && (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Donnees extraites
          </h4>
          <div className="flex flex-wrap gap-2">
            {entities.cpvCodes.map((code) => (
              <span key={code} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{code}</span>
            ))}
            {entities.budgetAmounts.map((amt) => (
              <span key={amt} className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded">{amt}</span>
            ))}
            {entities.contacts.map((c, i) => (
              <span key={i} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded">
                {c.name ?? c.email ?? c.phone}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extracted tables */}
      {hasTables && tables && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5" />
            Tableaux extraits ({tables.length})
          </h4>
          {tables.slice(0, 3).map((table, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
              <div className="text-[10px] text-slate-400 px-3 py-1 border-b border-slate-100">
                Page {table.pageNumber}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {table.headers.map((h, i) => (
                      <th key={i} className="px-3 py-1.5 text-left text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 5).map((row, ri) => (
                    <tr key={ri} className="border-t border-slate-50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-slate-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.rows.length > 5 && (
                <div className="text-[10px] text-slate-400 px-3 py-1 text-center border-t border-slate-100">
                  +{table.rows.length - 5} lignes
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
