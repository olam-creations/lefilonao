import JSZip from 'jszip';
import type { CompanyProfile, TechnicalPlanSection, RequiredDocumentDetailed, AoUploadedFile } from './dev';
import type { WorkspaceState } from './ao-utils';
import { downloadFile, triggerDownload } from './file-storage';

async function fetchPdfBytes(type: 'dc1' | 'dc2', profile: CompanyProfile, issuer: string, title: string): Promise<ArrayBuffer> {
  const res = await fetch('/api/documents/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, profile, issuer, title }),
  });
  if (!res.ok) throw new Error(`PDF ${type} generation failed`);
  return res.arrayBuffer();
}

interface ExportInput {
  profile: CompanyProfile;
  rfp: { title: string; issuer: string; deadline: string; budget: string };
  sections: TechnicalPlanSection[];
  workspace: WorkspaceState;
  documentsDetailed: RequiredDocumentDetailed[];
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function generateReadme(input: ExportInput): string {
  const { rfp, profile, documentsDetailed, workspace } = input;
  const totalDocs = documentsDetailed.length;
  const readyDocs = Object.values(workspace.documentsReady).filter(Boolean).length;

  const lines = [
    `DOSSIER DE CANDIDATURE`,
    `======================`,
    ``,
    `Marche : ${rfp.title}`,
    `Acheteur : ${rfp.issuer}`,
    `Date limite : ${new Date(rfp.deadline).toLocaleDateString('fr-FR')}`,
    `Budget : ${rfp.budget}`,
    ``,
    `Candidat : ${profile.companyName}`,
    `SIRET : ${profile.siret}`,
    `Forme juridique : ${profile.legalForm}`,
    ``,
    `CHECKLIST DOCUMENTS (${readyDocs}/${totalDocs} prets)`,
    `-------------------------------------------`,
  ];

  for (const doc of documentsDetailed) {
    const ready = workspace.documentsReady[doc.name] ? '[x]' : '[ ]';
    const critical = doc.isCritical ? ' (CRITIQUE)' : '';
    lines.push(`${ready} ${doc.name}${critical}`);
  }

  const cvCount = profile.team.filter((m) => m.cvFileId).length;
  lines.push('');
  lines.push(`EQUIPE (${cvCount}/${profile.team.length} CV joints)`);
  lines.push('--------------------------------------');
  for (const member of profile.team) {
    const cvStatus = member.cvFileId ? '[x]' : '[ ]';
    lines.push(`${cvStatus} ${member.name} — ${member.role} (${member.experience} ans)`);
  }

  const missingSections = input.sections.filter((s) => !workspace.sectionsReviewed[s.id]);
  if (missingSections.length > 0) {
    lines.push('');
    lines.push('SECTIONS MEMOIRE NON RELUES');
    lines.push('--------------------------');
    for (const s of missingSections) {
      lines.push(`- ${s.title}`);
    }
  }

  lines.push('');
  lines.push(`Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`);
  lines.push(`Par Le Filon AO`);

  return lines.join('\n');
}

export async function exportDossier(input: ExportInput): Promise<void> {
  const { profile, rfp, sections, workspace } = input;
  const zip = new JSZip();

  const shortTitle = sanitizeFilename(rfp.title.slice(0, 40));
  const dateStr = new Date().toISOString().slice(0, 10);
  const rootFolder = `Dossier_${shortTitle}_${dateStr}`;

  // 01 — Documents administratifs
  const adminFolder = zip.folder(`${rootFolder}/01_Documents_administratifs`);

  try {
    const dc1 = await fetchPdfBytes('dc1', profile, rfp.issuer, rfp.title);
    adminFolder!.file('DC1_Lettre_candidature.pdf', dc1);
  } catch {
    // DC1 generation failed — skip
  }

  try {
    const dc2 = await fetchPdfBytes('dc2', profile, rfp.issuer, rfp.title);
    adminFolder!.file('DC2_Declaration_candidat.pdf', dc2);
  } catch {
    // DC2 generation failed — skip
  }

  // Add uploaded profile documents
  for (const doc of profile.documents) {
    if (doc.fileId && doc.fileName) {
      try {
        const blob = await downloadFile(doc.fileId);
        if (blob) {
          adminFolder!.file(sanitizeFilename(doc.fileName), await blob.arrayBuffer());
        }
      } catch {
        // Skip files that can't be downloaded
      }
    }
  }

  // 02 — Memoire technique
  const memoireFolder = zip.folder(`${rootFolder}/02_Memoire_technique`);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const num = String(i + 1).padStart(2, '0');
    const fileName = `${num}_${sanitizeFilename(section.title)}.txt`;
    const content = [
      section.title.toUpperCase(),
      '='.repeat(section.title.length),
      '',
      `Attente acheteur : ${section.buyerExpectation}`,
      '',
      '---',
      '',
      section.aiDraft,
      '',
      `[Nombre de mots : ${section.wordCount}]`,
      `[Statut relecture : ${workspace.sectionsReviewed[section.id] ? 'Relu' : 'Non relu'}]`,
    ].join('\n');
    memoireFolder!.file(fileName, content);
  }

  // 03 — Documents AO-specifiques
  const aoFolder = zip.folder(`${rootFolder}/03_Documents_AO_specifiques`);

  const aoFiles: AoUploadedFile[] = workspace.aoFiles ?? [];
  for (const file of aoFiles) {
    try {
      const blob = await downloadFile(file.id);
      if (blob) {
        aoFolder!.file(sanitizeFilename(file.fileName), await blob.arrayBuffer());
      }
    } catch {
      // Skip files that can't be downloaded
    }
  }

  // 04 — CV Equipe
  const cvFolder = zip.folder(`${rootFolder}/04_CV_Equipe`);

  for (const member of profile.team) {
    if (member.cvFileId && member.cvFileName) {
      try {
        const blob = await downloadFile(member.cvFileId);
        if (blob) {
          const safeName = sanitizeFilename(`CV_${member.name}_${member.role}`);
          const ext = member.cvFileName.split('.').pop() || 'pdf';
          cvFolder!.file(`${safeName}.${ext}`, await blob.arrayBuffer());
        }
      } catch {
        // Skip CVs that can't be downloaded
      }
    }
  }

  // README
  zip.file(`${rootFolder}/README.txt`, generateReadme(input));

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `${rootFolder}.zip`);
}
