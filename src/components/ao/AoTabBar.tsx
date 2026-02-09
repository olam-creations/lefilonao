'use client';

import { FileText, BarChart3, FolderOpen, Globe } from 'lucide-react';

export type AoTab = 'essentiel' | 'analyse' | 'reponse' | 'marche';

interface AoTabBarProps {
  activeTab: AoTab;
  onTabChange: (tab: AoTab) => void;
}

const TABS: { key: AoTab; label: string; icon: React.ElementType }[] = [
  { key: 'essentiel', label: "L'essentiel", icon: FileText },
  { key: 'analyse', label: 'Notre analyse', icon: BarChart3 },
  { key: 'reponse', label: 'Préparer ma réponse', icon: FolderOpen },
  { key: 'marche', label: 'Marché', icon: Globe },
];

export default function AoTabBar({ activeTab, onTabChange }: AoTabBarProps) {
  return (
    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-1 justify-center ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
