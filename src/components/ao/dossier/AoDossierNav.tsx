'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FileText,
  FolderOpen,
  BarChart3,
  FolderCheck,
  Layers,
} from 'lucide-react';

export type DossierSection = 'synthese' | 'dce' | 'intelligence' | 'reponse' | 'lots';

interface NavItem {
  id: DossierSection;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'synthese', label: 'Synthese', icon: FileText },
  { id: 'dce', label: 'DCE', icon: FolderOpen },
  { id: 'intelligence', label: 'Intelligence', icon: BarChart3 },
  { id: 'reponse', label: 'Reponse', icon: FolderCheck },
  { id: 'lots', label: 'Lots', icon: Layers },
];

interface AoDossierNavProps {
  /** Sections that should appear in the nav (hides others) */
  visibleSections?: DossierSection[];
}

export default function AoDossierNav({ visibleSections }: AoDossierNavProps) {
  const [activeSection, setActiveSection] = useState<DossierSection>('synthese');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const items = visibleSections
    ? NAV_ITEMS.filter((item) => visibleSections.includes(item.id))
    : NAV_ITEMS;

  useEffect(() => {
    const sectionIds = items.map((item) => `section-${item.id}`);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const sectionId = visible[0].target.id.replace('section-', '') as DossierSection;
          setActiveSection(sectionId);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items]);

  const handleClick = (sectionId: DossierSection) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-4 px-4 lg:-mx-0 lg:px-0">
      <div className="flex gap-1 overflow-x-auto py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
