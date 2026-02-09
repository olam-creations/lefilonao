import { PDFDocument } from 'pdf-lib';
import type { CompanyProfile } from './dev';
import {
  loadFonts,
  drawDocHeader,
  drawSection,
  drawField,
  drawFieldBlock,
  drawEditableField,
  drawTable,
  drawParagraph,
  drawFooter,
  drawCheckbox,
  C,
  M, CW, PAGE_W, PAGE_H,
} from './pdf-utils';

interface Dc2Input {
  profile: CompanyProfile;
  issuer: string;
  title: string;
}

export async function generateDC2({ profile, issuer, title }: Dc2Input): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const form = doc.getForm();

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

  // ─── Section A — Identification ───
  y = drawSection(page1, fonts, 'A \u2013 IDENTIFICATION DU CANDIDAT', y);

  const blockW = (CW - 12) / 2;

  y = drawField(page1, fonts, 'Denomination / Raison sociale', profile.companyName, M.left, y);

  // SIRET + Legal form
  const row1Y = y;
  drawFieldBlock(page1, fonts, 'N\u00b0 SIRET', profile.siret, M.left, row1Y, blockW);
  drawFieldBlock(page1, fonts, 'Forme juridique', profile.legalForm, M.left + blockW + 12, row1Y, blockW);
  y = row1Y - 36;

  // Address
  y = drawField(page1, fonts, 'Adresse', profile.address, M.left, y);

  // Postal + City
  const row3Y = y;
  drawFieldBlock(page1, fonts, 'Code postal', profile.postalCode, M.left, row3Y, 120);
  drawFieldBlock(page1, fonts, 'Ville', profile.city, M.left + 132, row3Y, blockW);
  y = row3Y - 36;

  // NAF + TVA
  const row4Y = y;
  drawFieldBlock(page1, fonts, 'Code NAF/APE', profile.naf, M.left, row4Y, blockW);
  drawFieldBlock(page1, fonts, 'N\u00b0 TVA intracommunautaire', profile.tvaIntra, M.left + blockW + 12, row4Y, blockW);
  y = row4Y - 36;

  y -= 2;

  // ─── Section B — Renseignements economiques ───
  y = drawSection(page1, fonts, 'B \u2013 RENSEIGNEMENTS ECONOMIQUES ET FINANCIERS', y);

  const currentYear = new Date().getFullYear();
  const fmtEuro = (v: string) => v ? `${v} \u20ac` : '';

  // CA table — 3 columns
  y = drawTable(
    page1, fonts,
    [
      { header: `CA ${currentYear - 1}`, width: CW / 3, align: 'right' },
      { header: `CA ${currentYear - 2}`, width: CW / 3, align: 'right' },
      { header: `CA ${currentYear - 3}`, width: CW / 3, align: 'right' },
    ],
    [[fmtEuro(profile.caN1), fmtEuro(profile.caN2), fmtEuro(profile.caN3)]],
    M.left,
    y,
  );

  y -= 4;
  y = drawEditableField(page1, form, fonts, 'CA part. liee a l\u2019objet du marche', 'ca_objet', M.left, y, CW);
  y -= 2;

  // ─── Section C — Effectifs et moyens ───
  y = drawSection(page1, fonts, 'C \u2013 EFFECTIFS ET MOYENS TECHNIQUES', y);

  const thirdW = (CW - 24) / 3;
  const teamCount = profile.team.length.toString();
  const effY = y;
  drawFieldBlock(page1, fonts, 'Effectif global', profile.effectifTotal, M.left, effY, thirdW);
  drawFieldBlock(page1, fonts, 'Cadres / ingenieurs', teamCount, M.left + thirdW + 12, effY, thirdW);
  drawFieldBlock(page1, fonts, 'Capital social', profile.capitalSocial ? `${profile.capitalSocial} \u20ac` : '', M.left + (thirdW + 12) * 2, effY, thirdW);
  y = effY - 36;

  y = drawEditableField(page1, form, fonts, 'Moyens techniques et materiels', 'moyens_techniques', M.left, y, CW, 50);

  drawFooter(page1, fonts, 1, 2);

  // ═══════════════════════════════════════
  // PAGE 2 — References + Attestation
  // ═══════════════════════════════════════
  const page2 = doc.addPage([PAGE_W, PAGE_H]);
  y = PAGE_H - M.top - 6;

  // Mini header — page 2 continuation
  page2.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: C.navy });
  page2.drawText('DC2 \u2013 Declaration du candidat (suite)', {
    x: M.left,
    y,
    size: 9,
    font: fonts.bold,
    color: C.navy,
  });
  y -= 6;
  page2.drawLine({
    start: { x: M.left, y },
    end: { x: PAGE_W - M.right, y },
    thickness: 0.5,
    color: C.indigo,
  });
  y -= 16;

  // ─── Section D — References professionnelles ───
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
      refRows,
      M.left,
      y,
    );
  } else {
    y = drawParagraph(page2, fonts, 'Aucune reference renseignee dans le profil.', M.left, y, CW);
  }

  y -= 4;
  y = drawEditableField(page2, form, fonts, 'Reference supplementaire (client, objet, montant)', 'ref_supplementaire', M.left, y, CW, 40);
  y -= 2;

  // ─── Section E — Certifications ───
  y = drawSection(page2, fonts, 'E \u2013 CERTIFICATIONS ET QUALIFICATIONS', y);

  const allCerts = profile.team.flatMap((m) => m.certifications).filter(Boolean);
  if (allCerts.length > 0) {
    y = drawParagraph(page2, fonts, `Certifications detenues par l'equipe :`, M.left, y, CW, {
      size: 8,
      font: fonts.bold,
      color: C.mediumText,
    });
    for (const cert of allCerts) {
      y = drawCheckbox(page2, fonts, cert, true, M.left + 8, y);
    }
  } else {
    y = drawParagraph(page2, fonts, 'Aucune certification renseignee.', M.left, y, CW);
  }

  y -= 4;
  y = drawEditableField(page2, form, fonts, 'Autres certifications / qualifications', 'certifications_autres', M.left, y, CW, 30);
  y -= 2;

  // ─── Section F — Attestation ───
  y = drawSection(page2, fonts, 'F \u2013 ATTESTATION SUR L\u2019HONNEUR', y);

  const attestation = 'Je declare sur l\u2019honneur que les renseignements et documents fournis '
    + 'dans le present formulaire sont exacts et que le candidat a satisfait '
    + 'a l\u2019ensemble de ses obligations fiscales et sociales.';

  y = drawParagraph(page2, fonts, attestation, M.left, y, CW, { size: 8.5 });
  y -= 14;

  // ─── Signature block ───
  const sigBlockW = (CW - 12) / 2;
  const sigY = y;
  drawEditableField(page2, form, fonts, 'Fait a', 'dc2_fait_a', M.left, sigY, sigBlockW);
  drawEditableField(page2, form, fonts, 'Le (date)', 'dc2_date', M.left + sigBlockW + 12, sigY, sigBlockW);
  y = sigY - 38;

  y = drawEditableField(page2, form, fonts, 'Nom et qualite du signataire', 'dc2_signataire', M.left, y, CW);
  y = drawEditableField(page2, form, fonts, 'Signature', 'dc2_signature', M.left, y, CW, 50);

  drawFooter(page2, fonts, 2, 2);

  return doc.save();
}
