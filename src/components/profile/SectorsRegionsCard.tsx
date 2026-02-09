'use client';

import { useState, useRef } from 'react';
import { MapPin, Layers, Pencil, Check, X, Plus } from 'lucide-react';

interface SectorsRegionsCardProps {
  sectors: string[];
  regions: string[];
  onSave: (sectors: string[], regions: string[]) => void;
}

function TagInput({
  tags,
  onChange,
  placeholder,
  suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  suggestions: string[];
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()),
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg min-h-[42px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="w-3.5 h-3.5 rounded-full hover:bg-indigo-200 flex items-center justify-center transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'Ajouter...'}
          className="flex-1 min-w-[100px] px-1 py-0.5 text-sm text-slate-700 outline-none bg-transparent"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-3 h-3 inline mr-2 opacity-40" />{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SECTOR_SUGGESTIONS = [
  'Developpement logiciel',
  'Cloud & Infrastructure',
  'Cybersecurite',
  'Data & IA',
  'Conseil SI',
  'Integration systemes',
  'Reseaux & Telecom',
  'Formation numerique',
  'Infogérance',
  'GED & Dematerialisation',
  'ERP & CRM',
  'Design UX/UI',
  'Applications mobiles',
  'IoT & Systemes embarques',
];

const REGION_SUGGESTIONS = [
  'Ile-de-France',
  'Auvergne-Rhone-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Cote d\'Azur',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comte',
  'Centre-Val de Loire',
  'Corse',
  'Outre-mer',
];

export default function SectorsRegionsCard({ sectors, regions, onSave }: SectorsRegionsCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftSectors, setDraftSectors] = useState(sectors);
  const [draftRegions, setDraftRegions] = useState(regions);

  const handleEdit = () => {
    setDraftSectors([...sectors]);
    setDraftRegions([...regions]);
    setEditing(true);
  };

  const handleSave = () => {
    onSave(draftSectors, draftRegions);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraftSectors(sectors);
    setDraftRegions(regions);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900">Secteurs & Regions</h2>
        </div>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={handleSave} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <Check className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        )}
      </div>

      {/* Sectors */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Secteurs d&apos;activite</h3>
        {editing ? (
          <TagInput
            tags={draftSectors}
            onChange={setDraftSectors}
            placeholder="Tapez un secteur..."
            suggestions={SECTOR_SUGGESTIONS}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {sectors.length > 0 ? (
              sectors.map((s) => (
                <span key={s} className="keyword-tag">{s}</span>
              ))
            ) : (
              <span className="text-sm text-slate-300 italic">Aucun secteur defini</span>
            )}
          </div>
        )}
      </div>

      {/* Regions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
          Regions d&apos;interet
        </h3>
        {editing ? (
          <TagInput
            tags={draftRegions}
            onChange={setDraftRegions}
            placeholder="Tapez une region..."
            suggestions={REGION_SUGGESTIONS}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {regions.length > 0 ? (
              regions.map((r) => (
                <span key={r} className="keyword-tag">{r}</span>
              ))
            ) : (
              <span className="text-sm text-slate-300 italic">Aucune region definie</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
