import { PDFDocument } from 'pdf-lib';
import type { CompanyProfile } from './dev';
import {
  loadFonts,
  drawDocHeader,
  drawSection,
  drawField,
  drawFieldBlock,
  drawEditableField,
  drawCheckbox,
  drawParagraph,
  drawFooter,
  M, CW, PAGE_W, PAGE_H,
} from './pdf-utils';

interface Dc1Input {
  profile: CompanyProfile;
  issuer: string;
  title: string;
}

export async function generateDC1({ profile, issuer, title }: Dc1Input): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const form = doc.getForm();

  // ─── Header ───
  let y = drawDocHeader(page, fonts, {
    docType: 'DC1',
    docTitle: 'Lettre de candidature',
    issuer,
    title,
  });

  // ─── Section A — Objet de la consultation ───
  y = drawSection(page, fonts, 'A \u2013 OBJET DE LA CONSULTATION', y);

  y = drawField(page, fonts, 'Acheteur public', issuer, M.left, y);
  y = drawField(page, fonts, 'Objet du marche', title, M.left, y);
  y = drawEditableField(page, form, fonts, 'N\u00b0 de lot (le cas echeant)', 'numero_lot', M.left, y, 220);
  y -= 4;

  // ─── Section B — Identification du candidat ───
  y = drawSection(page, fonts, 'B \u2013 IDENTIFICATION DU CANDIDAT', y);

  // Row 1: Company name (full width)
  const blockW = (CW - 12) / 2;
  y = drawField(page, fonts, 'Denomination / Raison sociale', profile.companyName, M.left, y);

  // Row 2: SIRET + Legal form (2 columns)
  const row2Y = y;
  drawFieldBlock(page, fonts, 'N\u00b0 SIRET', profile.siret, M.left, row2Y, blockW);
  drawFieldBlock(page, fonts, 'Forme juridique', profile.legalForm, M.left + blockW + 12, row2Y, blockW);
  y = row2Y - 36;

  // Row 3: Address (full width)
  y = drawField(page, fonts, 'Adresse', profile.address, M.left, y);

  // Row 4: Postal + City (2 columns)
  const row4Y = y;
  drawFieldBlock(page, fonts, 'Code postal', profile.postalCode, M.left, row4Y, 120);
  drawFieldBlock(page, fonts, 'Ville', profile.city, M.left + 132, row4Y, blockW);
  y = row4Y - 36;

  // Row 5: Phone + Email (2 columns)
  const row5Y = y;
  drawFieldBlock(page, fonts, 'Telephone', profile.phone, M.left, row5Y, blockW);
  drawFieldBlock(page, fonts, 'Courriel', profile.email, M.left + blockW + 12, row5Y, blockW);
  y = row5Y - 36;

  y -= 2;

  // ─── Section C — Type de candidature ───
  y = drawSection(page, fonts, 'C \u2013 TYPE DE CANDIDATURE', y);

  y = drawCheckbox(page, fonts, 'Candidature individuelle', true, M.left, y);
  y = drawCheckbox(page, fonts, 'Groupement conjoint', false, M.left, y);
  y = drawCheckbox(page, fonts, 'Groupement solidaire', false, M.left, y);
  y -= 4;

  // ─── Section D — Engagement ───
  y = drawSection(page, fonts, 'D \u2013 ENGAGEMENT DU CANDIDAT', y);

  const engagementText = 'Le candidat atteste sur l\u2019honneur : '
    + '(a) ne pas entrer dans l\u2019un des cas d\u2019interdiction de soumissionner prevus aux articles L.2141-1 a L.2141-5 '
    + 'et L.2141-7 a L.2141-11 du Code de la commande publique ; '
    + '(b) etre en regle au regard des articles L.5212-1 a L.5212-11 du Code du travail '
    + 'concernant l\u2019emploi des travailleurs handicapes.';

  y = drawParagraph(page, fonts, engagementText, M.left, y, CW, { size: 8 });
  y -= 14;

  // ─── Signature block ───
  const sigBlockW = (CW - 12) / 2;
  const sigY = y;
  drawEditableField(page, form, fonts, 'Fait a', 'fait_a', M.left, sigY, sigBlockW);
  drawEditableField(page, form, fonts, 'Le (date)', 'date_signature', M.left + sigBlockW + 12, sigY, sigBlockW);
  y = sigY - 38;

  y = drawEditableField(page, form, fonts, 'Nom et qualite du signataire', 'signataire', M.left, y, CW);
  y = drawEditableField(page, form, fonts, 'Signature', 'signature', M.left, y, CW, 50);

  // ─── Footer ───
  drawFooter(page, fonts, 1, 1);

  return doc.save();
}
