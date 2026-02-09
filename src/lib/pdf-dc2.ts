import { PDFDocument, type PDFImage } from 'pdf-lib';
import type { CompanyProfile } from './dev';
import {
  loadFonts,
  drawDocHeader,
  drawSection,
  drawField,
  drawFieldBlock,
  afterFieldBlocks,
  drawEditableField,
  drawTable,
  drawParagraph,
  drawFooter,
  drawCheckbox,
  drawContinuationHeader,
  drawAttestationBox,
  drawSignatureBlock,
  drawESignatureBlock,
  drawDivider,
  base64ToBytes,
  C,
  M, CW, PAGE_W, PAGE_H,
  type ESignData,
} from './pdf-utils';

interface Dc2Input {
  profile: CompanyProfile;
  issuer: string;
  title: string;
  signer?: ESignData;
}

export async function generateDC2({ profile, issuer, title, signer }: Dc2Input): Promise<Uint8Array> {
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
  // PAGE 1 — Identification + Financials
  // ═══════════════════════════════════════
  const page1 = doc.addPage([PAGE_W, PAGE_H]);

  let y = drawDocHeader(page1, fonts, {
    docType: 'DC2',
    docTitle: 'Declaration du candidat',
    issuer,
    title,
  });

  // ─── A — Identification ───
  y = drawSection(page1, fonts, 'A \u2013 IDENTIFICATION DU CANDIDAT', y);
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

  drawFieldBlock(page1, fonts, 'Code NAF/APE', profile.naf, M.left, y, blockW);
  drawFieldBlock(page1, fonts, 'N\u00b0 TVA intracommunautaire', profile.tvaIntra, M.left + blockW + 12, y, blockW);
  y = afterFieldBlocks(y);

  // ─── B — Renseignements economiques ───
  y = drawSection(page1, fonts, 'B \u2013 RENSEIGNEMENTS ECONOMIQUES ET FINANCIERS', y);

  const currentYear = new Date().getFullYear();
  const fmtEuro = (v: string) => v ? `${v} \u20ac` : '';

  y = drawTable(
    page1, fonts,
    [
      { header: `CA ${currentYear - 1}`, width: CW / 3, align: 'right' },
      { header: `CA ${currentYear - 2}`, width: CW / 3, align: 'right' },
      { header: `CA ${currentYear - 3}`, width: CW / 3, align: 'right' },
    ],
    [[fmtEuro(profile.caN1), fmtEuro(profile.caN2), fmtEuro(profile.caN3)]],
    M.left, y,
  );

  y = drawEditableField(page1, form, fonts, 'CA part. liee a l\u2019objet du marche', 'ca_objet', M.left, y, CW);

  // ─── C — Effectifs et moyens ───
  y = drawSection(page1, fonts, 'C \u2013 EFFECTIFS ET MOYENS TECHNIQUES', y);

  const thirdW = (CW - 24) / 3;
  const teamCount = profile.team.length.toString();

  drawFieldBlock(page1, fonts, 'Effectif global', profile.effectifTotal, M.left, y, thirdW);
  drawFieldBlock(page1, fonts, 'Cadres / ingenieurs', teamCount, M.left + thirdW + 12, y, thirdW);
  drawFieldBlock(page1, fonts, 'Capital social', profile.capitalSocial ? `${profile.capitalSocial} \u20ac` : '', M.left + (thirdW + 12) * 2, y, thirdW);
  y = afterFieldBlocks(y);

  y = drawEditableField(page1, form, fonts, 'Moyens techniques et materiels', 'moyens_techniques', M.left, y, CW, 50);

  drawFooter(page1, fonts, 'DC2', 1, 2);

  // ═══════════════════════════════════════
  // PAGE 2 — References + Attestation
  // ═══════════════════════════════════════
  const page2 = doc.addPage([PAGE_W, PAGE_H]);
  y = drawContinuationHeader(page2, fonts, 'DC2', 'Declaration du candidat');

  // ─── D — References ───
  y = drawSection(page2, fonts, 'D \u2013 REFERENCES PROFESSIONNELLES', y);

  if (profile.references.length > 0) {
    const refRows = profile.references.map((r) => [
      r.client,
      r.title,
      r.amount ? `${r.amount} \u20ac` : '',
      r.period,
    ]);

    y = drawTable(
      page2, fonts,
      [
        { header: 'Client', width: CW * 0.25 },
        { header: 'Projet', width: CW * 0.35 },
        { header: 'Montant', width: CW * 0.2, align: 'right' },
        { header: 'Periode', width: CW * 0.2 },
      ],
      refRows, M.left, y,
    );
  } else {
    y = drawParagraph(page2, fonts, 'Aucune reference renseignee dans le profil.', M.left, y, CW);
  }

  y = drawEditableField(page2, form, fonts, 'Reference supplementaire (client, objet, montant)', 'ref_supplementaire', M.left, y, CW, 40);

  // ─── E — Certifications ───
  y = drawSection(page2, fonts, 'E \u2013 CERTIFICATIONS ET QUALIFICATIONS', y);

  const allCerts = profile.team.flatMap((m) => m.certifications).filter(Boolean);
  if (allCerts.length > 0) {
    y = drawParagraph(page2, fonts, 'Certifications detenues par l\'equipe :', M.left, y, CW, {
      size: 8,
      font: fonts.bold,
      color: C.mid,
    });
    for (const cert of allCerts) {
      y = drawCheckbox(page2, fonts, cert, true, M.left + 4, y);
    }
  } else {
    y = drawParagraph(page2, fonts, 'Aucune certification renseignee.', M.left, y, CW);
  }

  y = drawEditableField(page2, form, fonts, 'Autres certifications / qualifications', 'certifications_autres', M.left, y, CW, 30);

  // ─── F — Attestation ───
  y = drawSection(page2, fonts, 'F \u2013 ATTESTATION SUR L\u2019HONNEUR', y);

  const attestation = 'Je declare sur l\u2019honneur que les renseignements et documents fournis '
    + 'dans le present formulaire sont exacts et que le candidat a satisfait '
    + 'a l\u2019ensemble de ses obligations fiscales et sociales.';

  y = drawAttestationBox(page2, fonts, attestation, M.left, y, CW);

  // ─── Signature ───
  y = signer
    ? drawESignatureBlock(page2, fonts, signer, y, cachetImage)
    : drawSignatureBlock(page2, form, fonts, y, 'dc2', cachetImage);

  drawFooter(page2, fonts, 'DC2', 2, 2);
  return doc.save();
}
