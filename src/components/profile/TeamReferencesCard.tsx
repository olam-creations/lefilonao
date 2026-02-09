'use client';

import { useState } from 'react';
import { Users, Award, Briefcase, FileText, Download, Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import type { TeamMember, ProjectReference } from '@/lib/dev';
import FileUploadZone from '@/components/shared/FileUploadZone';
import { formatFileSize } from '@/lib/file-storage';

interface TeamReferencesCardProps {
  team: TeamMember[];
  references: ProjectReference[];
  onSaveTeam: (team: TeamMember[]) => void;
  onSaveReferences: (references: ProjectReference[]) => void;
  onCvUpload: (memberName: string, file: File) => Promise<void>;
  onCvDownload: (memberName: string) => void;
  onCvDelete: (memberName: string) => void;
}

const EMPTY_MEMBER: TeamMember = {
  name: '',
  role: '',
  certifications: [],
  experience: 0,
  cvFileId: null,
  cvFileName: null,
  cvFileSize: null,
  cvMimeType: null,
  cvUploadedAt: null,
};

const EMPTY_REF: ProjectReference = {
  client: '',
  title: '',
  amount: '',
  period: '',
};

function MemberForm({
  member,
  onSave,
  onCancel,
}: {
  member: TeamMember;
  onSave: (m: TeamMember) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(member);
  const [certInput, setCertInput] = useState('');

  const addCert = () => {
    const trimmed = certInput.trim();
    if (trimmed && !draft.certifications.includes(trimmed)) {
      setDraft({ ...draft, certifications: [...draft.certifications, trimmed] });
      setCertInput('');
    }
  };

  const removeCert = (cert: string) => {
    setDraft({ ...draft, certifications: draft.certifications.filter((c) => c !== cert) });
  };

  const valid = draft.name.trim() && draft.role.trim();

  return (
    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nom complet"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <input
          type="text"
          value={draft.role}
          onChange={(e) => setDraft({ ...draft, role: e.target.value })}
          placeholder="Role (ex: Lead Dev)"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
              placeholder="Ajouter certification..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button onClick={addCert} className="px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {draft.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {draft.certifications.map((cert) => (
                <span key={cert} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-xs text-indigo-700 rounded-full border border-indigo-100">
                  {cert}
                  <button onClick={() => removeCert(cert)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          value={draft.experience || ''}
          onChange={(e) => setDraft({ ...draft, experience: parseInt(e.target.value) || 0 })}
          placeholder="Exp."
          min={0}
          className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          Annuler
        </button>
        <button
          onClick={() => valid && onSave(draft)}
          disabled={!valid}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function RefForm({
  reference,
  onSave,
  onCancel,
}: {
  reference: ProjectReference;
  onSave: (r: ProjectReference) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(reference);
  const valid = draft.client.trim() && draft.title.trim();

  return (
    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={draft.client}
          onChange={(e) => setDraft({ ...draft, client: e.target.value })}
          placeholder="Client"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Intitule du projet"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          placeholder="Montant (ex: 380 000\u20ac)"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <input
          type="text"
          value={draft.period}
          onChange={(e) => setDraft({ ...draft, period: e.target.value })}
          placeholder="Periode (ex: 2023-2024)"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          Annuler
        </button>
        <button
          onClick={() => valid && onSave(draft)}
          disabled={!valid}
          className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

export default function TeamReferencesCard({
  team,
  references,
  onSaveTeam,
  onSaveReferences,
  onCvUpload,
  onCvDownload,
  onCvDelete,
}: TeamReferencesCardProps) {
  const cvCount = team.filter((m) => m.cvFileId).length;
  const [addingMember, setAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [addingRef, setAddingRef] = useState(false);
  const [editingRef, setEditingRef] = useState<string | null>(null);

  const handleAddMember = (m: TeamMember) => {
    onSaveTeam([...team, m]);
    setAddingMember(false);
  };

  const handleEditMember = (original: string, updated: TeamMember) => {
    onSaveTeam(team.map((m) => (m.name === original ? { ...updated, cvFileId: m.cvFileId, cvFileName: m.cvFileName, cvFileSize: m.cvFileSize, cvMimeType: m.cvMimeType, cvUploadedAt: m.cvUploadedAt } : m)));
    setEditingMember(null);
  };

  const handleDeleteMember = (name: string) => {
    onSaveTeam(team.filter((m) => m.name !== name));
  };

  const handleAddRef = (r: ProjectReference) => {
    onSaveReferences([...references, r]);
    setAddingRef(false);
  };

  const handleEditRef = (original: string, updated: ProjectReference) => {
    onSaveReferences(references.map((r) => (r.title === original ? updated : r)));
    setEditingRef(null);
  };

  const handleDeleteRef = (title: string) => {
    onSaveReferences(references.filter((r) => r.title !== title));
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900">Equipe & References</h2>
        </div>
        {team.length > 0 && (
          <span className="text-xs text-slate-400">{cvCount}/{team.length} CV</span>
        )}
      </div>

      {/* Team */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-500" />
            Membres cles
          </h3>
          {!addingMember && (
            <button
              onClick={() => setAddingMember(true)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          )}
        </div>
        <div className="space-y-3">
          {team.map((member) =>
            editingMember === member.name ? (
              <MemberForm
                key={member.name}
                member={member}
                onSave={(m) => handleEditMember(member.name, m)}
                onCancel={() => setEditingMember(null)}
              />
            ) : (
              <div key={member.name} className="bg-slate-50 rounded-xl p-4 border border-slate-100 group">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{member.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-indigo-600 mr-2">{member.experience} ans</span>
                    <button
                      onClick={() => setEditingMember(member.name)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.name)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {member.certifications.map((cert) => (
                    <span key={cert} className="keyword-tag text-[10px] px-2 py-0.5">
                      {cert}
                    </span>
                  ))}
                </div>

                {/* CV section */}
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  {member.cvFileId && member.cvFileName ? (
                    <div className="flex items-center gap-2 text-xs bg-white rounded-lg px-3 py-2 border border-slate-100">
                      <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-slate-600 truncate flex-1">{member.cvFileName}</span>
                      {member.cvFileSize && (
                        <span className="text-slate-400 flex-shrink-0">{formatFileSize(member.cvFileSize)}</span>
                      )}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => onCvDownload(member.name)}
                          className="p-1 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onCvDelete(member.name)}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <FileUploadZone
                      onUpload={(file) => onCvUpload(member.name, file)}
                      accept=".pdf,.doc,.docx"
                      compact
                      label="Ajouter le CV (PDF)"
                    />
                  )}
                </div>
              </div>
            ),
          )}
          {addingMember && (
            <MemberForm
              member={EMPTY_MEMBER}
              onSave={handleAddMember}
              onCancel={() => setAddingMember(false)}
            />
          )}
          {team.length === 0 && !addingMember && (
            <p className="text-sm text-slate-300 italic text-center py-4">
              Aucun membre. Cliquez &quot;Ajouter&quot; pour commencer.
            </p>
          )}
        </div>
      </div>

      {/* References */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-500" />
            References projets
          </h3>
          {!addingRef && (
            <button
              onClick={() => setAddingRef(true)}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          )}
        </div>
        <div className="space-y-2">
          {references.map((ref) =>
            editingRef === ref.title ? (
              <RefForm
                key={ref.title}
                reference={ref}
                onSave={(r) => handleEditRef(ref.title, r)}
                onCancel={() => setEditingRef(null)}
              />
            ) : (
              <div key={ref.title} className="flex justify-between items-start gap-3 py-3 border-b border-slate-100 last:border-0 group">
                <div className="min-w-0">
                  <div className="text-sm text-slate-700 font-medium">{ref.title}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{ref.client}</span>
                    <span>&middot;</span>
                    <span>{ref.period}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold font-mono text-slate-900">{ref.amount}</span>
                  <button
                    onClick={() => setEditingRef(ref.title)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRef(ref.title)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ),
          )}
          {addingRef && (
            <RefForm
              reference={EMPTY_REF}
              onSave={handleAddRef}
              onCancel={() => setAddingRef(false)}
            />
          )}
          {references.length === 0 && !addingRef && (
            <p className="text-sm text-slate-300 italic text-center py-4">
              Aucune reference. Cliquez &quot;Ajouter&quot; pour commencer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
