import { PDFDocument, type PDFImage } from 'pdf-lib';
import type { CompanyProfile } from './dev';
import {
  loadFonts,
  drawDocHeader,
  drawContinuationHeader,
  drawSection,
  drawField,
  drawFieldBlock,
  afterFieldBlocks,
  drawEditableField,
  drawCheckbox,
  drawAttestationBox,
  drawSignatureBlock,
  drawESignatureBlock,
  drawDivider,
  drawFooter,
  base64ToBytes,
  M, CW, PAGE_W, PAGE_H,
  type ESignData,
} from './pdf-utils';

interface Dc1Input {
  profile: CompanyProfile;
  issuer: string;
  title: string;
  signer?: ESignData;
}

export async function generateDC1({ profile, issuer, title, signer }: Dc1Input): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const form = doc.getForm();

  let cachetImage: PDFImage | undefined;
  if (profile.cachetBase64) {
    const bytes = base64ToBytes(profile.cachetBase64);
    cachetImage = profile.cachetBase64.includes('image/png')
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
  }

  // ═══════════════════════════════════════
  // PAGE 1 — Objet + Identification + Type
  // ═══════════════════════════════════════
  const page1 = doc.addPage([PAGE_W, PAGE_H]);

  let y = drawDocHeader(page1, fonts, {
    docType: 'DC1',
    docTitle: 'Lettre de candidature',
    issuer,
    title,
  });

  // ─── A — Objet de la consultation ───
  y = drawSection(page1, fonts, 'A \u2013 OBJET DE LA CONSULTATION', y);
  y = drawField(page1, fonts, 'Acheteur public', issuer, M.left, y);
  y = drawField(page1, fonts, 'Objet du marche', title, M.left, y);
  y = drawEditableField(page1, form, fonts, 'N\u00b0 de lot (le cas echeant)', 'numero_lot', M.left, y, 220);

  // ─── B — Identification du candidat ───
  y = drawSection(page1, fonts, 'B \u2013 IDENTIFICATION DU CANDIDAT', y);
  y = drawField(page1, fonts, 'Denomination / Raison sociale', profile.companyName, M.left, y);

  const blockW = (CW - 12) / 2;

  drawFieldBlock(page1, fonts, 'N\u00b0 SIRET', profile.siret, M.left, y, blockW);
  drawFieldBlock(page1, fonts, 'Forme juridique', profile.legalForm, M.left + blockW + 12, y, blockW);
  y = afterFieldBlocks(y);
  y = drawDivider(page1, y);

  y = drawField(page1, fonts, 'Adresse', profile.address, M.left, y);

  drawFieldBlock(page1, fonts, 'Code postal', profile.postalCode, M.left, y, 120);
  drawFieldBlock(page1, fonts, 'Ville', profile.city, M.left + 132, y, blockW);
  y = afterFieldBlocks(y);
  y = drawDivider(page1, y);

  drawFieldBlock(page1, fonts, 'Telephone', profile.phone, M.left, y, blockW);
  drawFieldBlock(page1, fonts, 'Courriel', profile.email, M.left + blockW + 12, y, blockW);
  y = afterFieldBlocks(y);

  // ─── C — Type de candidature ───
  y = drawSection(page1, fonts, 'C \u2013 TYPE DE CANDIDATURE', y);
  y = drawCheckbox(page1, fonts, 'Candidature individuelle', true, M.left, y);
  y = drawCheckbox(page1, fonts, 'Groupement conjoint', false, M.left, y);
  y = drawCheckbox(page1, fonts, 'Groupement solidaire', false, M.left, y);

  drawFooter(page1, fonts, 'DC1', 1, 2);

  // ═══════════════════════════════════════
  // PAGE 2 — Engagement + Signature
  // ═══════════════════════════════════════
  const page2 = doc.addPage([PAGE_W, PAGE_H]);
  y = drawContinuationHeader(page2, fonts, 'DC1', 'Lettre de candidature');

  // ─── D — Engagement ───
  y = drawSection(page2, fonts, 'D \u2013 ENGAGEMENT DU CANDIDAT', y);

  const engagementText = 'Le candidat atteste sur l\u2019honneur : '
    + '(a) ne pas entrer dans l\u2019un des cas d\u2019interdiction de soumissionner prevus aux articles L.2141-1 a L.2141-5 '
    + 'et L.2141-7 a L.2141-11 du Code de la commande publique ; '
    + '(b) etre en regle au regard des articles L.5212-1 a L.5212-11 du Code du travail '
    + 'concernant l\u2019emploi des travailleurs handicapes.';

  y = drawAttestationBox(page2, fonts, engagementText, M.left, y, CW);

  // ─── Signature ───
  y = signer
    ? drawESignatureBlock(page2, fonts, signer, y, cachetImage)
    : drawSignatureBlock(page2, form, fonts, y, 'dc1', cachetImage);

  drawFooter(page2, fonts, 'DC1', 2, 2);
  return doc.save();
}
