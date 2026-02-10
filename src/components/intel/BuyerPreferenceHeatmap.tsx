'use client';

import { useState, useEffect } from 'react';
import { Grid3X3, Loader2 } from 'lucide-react';

interface PreferenceSignal {
  label: string;
  score: number;
}

interface PreferencesData {
  buyerName: string;
  totalContracts: number;
  signals: Record<string, PreferenceSignal>;
  avgAmount: number;
}

function HeatCell({ score }: { score: number }) {
  const opacity = Math.max(0.1, score / 100);
  return (
    <div
      className="h-8 rounded flex items-center justify-center"
      style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
    >
      <span className={`text-[10px] font-bold ${score >= 50 ? 'text-white' : 'text-indigo-900'}`}>
        {score}%
      </span>
    </div>
  );
}

interface BuyerPreferenceHeatmapProps {
  buyers: string[];
}

export default function BuyerPreferenceHeatmap({ buyers }: BuyerPreferenceHeatmapProps) {
  const [data, setData] = useState<PreferencesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (buyers.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(
      buyers.slice(0, 5).map((name) =>
        fetch(`/api/intel/buyer-preferences?buyer_name=${encodeURIComponent(name)}`)
          .then((r) => r.json())
          .then((d) => d.preferences as PreferencesData | null)
          .catch(() => null)
      )
    ).then((results) => {
      setData(results.filter(Boolean) as PreferencesData[]);
      setLoading(false);
    });
  }, [buyers]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Grid3X3 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900">Preferences acheteurs</h3>
        </div>
        <p className="text-xs text-slate-400 text-center py-6">Ajoutez des acheteurs a votre watchlist</p>
      </div>
    );
  }

  // Extract signal keys from first result
  const signalKeys = Object.keys(data[0].signals);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Preferences acheteurs</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[10px] text-slate-400 font-medium pb-2 pr-3 min-w-[120px]">Acheteur</th>
              {signalKeys.map((key) => (
                <th key={key} className="text-center text-[10px] text-slate-400 font-medium pb-2 px-1 min-w-[70px]">
                  {data[0].signals[key].label.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((buyer) => (
              <tr key={buyer.buyerName}>
                <td className="text-xs text-slate-700 font-medium py-1 pr-3 truncate max-w-[160px]">
                  {buyer.buyerName}
                </td>
                {signalKeys.map((key) => (
                  <td key={key} className="py-1 px-1">
                    <HeatCell score={Math.round(buyer.signals[key]?.score ?? 0)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Intensite:</span>
        <div className="flex gap-0.5">
          {[10, 30, 50, 70, 90].map((v) => (
            <div
              key={v}
              className="w-4 h-3 rounded-sm"
              style={{ backgroundColor: `rgba(99, 102, 241, ${v / 100})` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-400">faible → fort</span>
      </div>
    </div>
  );
}
