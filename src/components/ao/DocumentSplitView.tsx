'use client';

import { FolderCheck, AlertCircle, Check, Settings, FileText } from 'lucide-react';
import Link from 'next/link';
import type { RequiredDocumentDetailed, ProfileDocument, AoUploadedFile } from '@/lib/dev';
import FileUploadZone from '@/components/shared/FileUploadZone';
import FileRow from '@/components/shared/FileRow';
import { downloadFile, deleteFile as deleteStoredFile, triggerDownload } from '@/lib/file-storage';

interface DocumentSplitViewProps {
  documents: RequiredDocumentDetailed[];
  ready: Record<string, boolean>;
  onToggle: (docName: string) => void;
  profileDocuments: ProfileDocument[];
  onAoFileUpload: (documentName: string, file: File) => Promise<void>;
  aoFiles: AoUploadedFile[];
  onAoFileDelete: (fileId: string) => void;
}

function isProfileDocReady(docName: string, profileDocuments: ProfileDocument[]): boolean {
  const normalized = docName.toLowerCase();
  return profileDocuments.some((pd) => {
    const pdNorm = pd.name.toLowerCase();
    return (normalized.includes(pdNorm) || pdNorm.includes(normalized.split(' - ')[0].toLowerCase()))
      && (pd.status === 'valid' || pd.status === 'expiring');
  });
}

function findProfileDoc(docName: string, profileDocuments: ProfileDocument[]): ProfileDocument | undefined {
  const normalized = docName.toLowerCase();
  return profileDocuments.find((pd) => {
    const pdNorm = pd.name.toLowerCase();
    return (normalized.includes(pdNorm) || pdNorm.includes(normalized.split(' - ')[0].toLowerCase()));
  });
}

function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors duration-200 ${
        isOn ? 'bg-emerald-500' : 'bg-slate-200'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          isOn ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function DocumentSplitView({
  documents, ready, onToggle, profileDocuments,
  onAoFileUpload, aoFiles, onAoFileDelete,
}: DocumentSplitViewProps) {
  const profileDocs = documents.filter((d) => d.category === 'profile');
  const aoDocs = documents.filter((d) => d.category === 'ao-specific');

  const totalReady = Object.values(ready).filter(Boolean).length;
  const total = documents.length;
  const pct = total > 0 ? (totalReady / total) * 100 : 0;

  const handleAoFileDownload = async (file: AoUploadedFile) => {
    const blob = await downloadFile(file.id);
    if (blob) triggerDownload(blob, file.fileName);
  };

  const handleAoFileDelete = async (file: AoUploadedFile) => {
    await deleteStoredFile(file.id);
    onAoFileDelete(file.id);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <FolderCheck className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Documents a preparer</h2>
            <p className="text-xs text-slate-400">{totalReady}/{total} documents prets</p>
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Profile documents */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Documents profil entreprise
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {profileDocs.map((doc) => {
              const fromProfile = isProfileDocReady(doc.name, profileDocuments);
              const profileDoc = findProfileDoc(doc.name, profileDocuments);
              return (
                <div key={doc.name} className="p-4">
                  <div className="flex items-center gap-3">
                    {fromProfile ? (
                      <span className="doc-status-valid">
                        <Check className="w-3 h-3" /> Disponible
                      </span>
                    ) : (
                      <Link href="/dashboard/profile" className="doc-status-missing">
                        <Settings className="w-3 h-3" /> Configurer
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-medium ${fromProfile ? 'text-slate-400' : 'text-slate-900'}`}>
                        {doc.name}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.hint}</p>
                    </div>
                  </div>
                  {fromProfile && profileDoc?.fileName && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 bg-slate-50 rounded-lg px-3 py-1.5">
                      <FileText className="w-3 h-3 text-emerald-500" />
                      <span className="truncate">{profileDoc.fileName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AO-specific documents */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Documents specifiques a cet AO
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {aoDocs.map((doc) => {
              const isReady = !!ready[doc.name];
              const showWarning = doc.isCritical && !isReady;
              const docFiles = aoFiles.filter((f) => f.documentName === doc.name);

              return (
                <div
                  key={doc.name}
                  className={`p-4 transition-colors ${showWarning ? 'bg-red-50/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Toggle isOn={isReady} onToggle={() => onToggle(doc.name)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isReady ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {doc.name}
                        </span>
                        {showWarning && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.hint}</p>
                    </div>
                  </div>

                  {/* Uploaded files for this document */}
                  {docFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {docFiles.map((f) => (
                        <FileRow
                          key={f.id}
                          fileName={f.fileName}
                          fileSize={f.fileSize}
                          mimeType={f.mimeType}
                          uploadedAt={f.uploadedAt}
                          onDownload={() => handleAoFileDownload(f)}
                          onDelete={() => handleAoFileDelete(f)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Upload zone */}
                  <div className="mt-2">
                    <FileUploadZone
                      onUpload={(file) => onAoFileUpload(doc.name, file)}
                      compact
                      label="Ajouter un fichier"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
