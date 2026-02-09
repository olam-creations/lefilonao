import { PDFDocument, rgb } from 'pdf-lib';
import type { CompanyProfile } from './dev';
import {
  loadFonts,
  addHeader,
  addSection,
  addLabeledField,
  addLabel,
  addParagraph,
  MARGINS,
  CONTENT_WIDTH,
  PAGE_WIDTH,
  PAGE_HEIGHT,
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

  // Page 1 — Identity + Financials
  const page1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = addHeader(page1, fonts, 'DC2 \u2013 D\u00e9claration du candidat');

  // Section A — Identification
  y = addSection(page1, fonts, 'A \u2013 IDENTIFICATION DU CANDIDAT', y);

  y = addLabeledField(page1, form, fonts, 'Acheteur public', 'dc2_acheteur', issuer, MARGINS.left, y, CONTENT_WIDTH);
  y = addLabeledField(page1, form, fonts, 'Objet du march\u00e9', 'dc2_objet', title, MARGINS.left, y, CONTENT_WIDTH, 30);

  const halfWidth = (CONTENT_WIDTH - 16) / 2;

  y = addLabeledField(page1, form, fonts, 'D\u00e9nomination / Raison sociale', 'dc2_denomination', profile.companyName, MARGINS.left, y, CONTENT_WIDTH);
  y = addLabeledField(page1, form, fonts, 'N\u00b0 SIRET', 'dc2_siret', profile.siret, MARGINS.left, y, halfWidth);

  const formeY = y + 30;
  addLabeledField(page1, form, fonts, 'Forme juridique', 'dc2_forme', profile.legalForm, MARGINS.left + halfWidth + 16, formeY, halfWidth);

  y = addLabeledField(page1, form, fonts, 'Adresse', 'dc2_adresse', profile.address, MARGINS.left, y, CONTENT_WIDTH);

  y = addLabeledField(page1, form, fonts, 'Code postal', 'dc2_cp', profile.postalCode, MARGINS.left, y, 120);
  const villeY = y + 30;
  addLabeledField(page1, form, fonts, 'Ville', 'dc2_ville', profile.city, MARGINS.left + 136, villeY, halfWidth);

  y -= 6;

  // Section B — Renseignements \u00e9conomiques et financiers
  y = addSection(page1, fonts, 'B \u2013 RENSEIGNEMENTS \u00c9CONOMIQUES ET FINANCIERS', y);

  const thirdWidth = (CONTENT_WIDTH - 32) / 3;
  const currentYear = new Date().getFullYear();

  const caN1 = profile.caN1 ? `${profile.caN1} \u20ac` : '';
  const caN2 = profile.caN2 ? `${profile.caN2} \u20ac` : '';
  const caN3 = profile.caN3 ? `${profile.caN3} \u20ac` : '';
  y = addLabeledField(page1, form, fonts, `Chiffre d'affaires ${currentYear - 1}`, 'ca_n1', caN1, MARGINS.left, y, thirdWidth);
  const ca2Y = y + 30;
  addLabeledField(page1, form, fonts, `Chiffre d'affaires ${currentYear - 2}`, 'ca_n2', caN2, MARGINS.left + thirdWidth + 16, ca2Y, thirdWidth);
  addLabeledField(page1, form, fonts, `Chiffre d'affaires ${currentYear - 3}`, 'ca_n3', caN3, MARGINS.left + (thirdWidth + 16) * 2, ca2Y, thirdWidth);

  y = addLabeledField(page1, form, fonts, 'CA part. li\u00e9e \u00e0 l\u2019objet du march\u00e9', 'ca_objet', '', MARGINS.left, y, CONTENT_WIDTH);

  y -= 6;

  // Section C — Effectifs
  y = addSection(page1, fonts, 'C \u2013 EFFECTIFS ET MOYENS', y);

  const teamCount = profile.team.length.toString();
  const effectifGlobal = profile.effectifTotal || '';
  y = addLabeledField(page1, form, fonts, 'Effectif global de l\u2019entreprise', 'effectif_global', effectifGlobal, MARGINS.left, y, halfWidth);
  const effCadreY = y + 30;
  addLabeledField(page1, form, fonts, 'Dont cadres et ing\u00e9nieurs', 'effectif_cadres', teamCount, MARGINS.left + halfWidth + 16, effCadreY, halfWidth);

  y = addLabeledField(page1, form, fonts, 'Moyens techniques et mat\u00e9riels', 'moyens_techniques', '', MARGINS.left, y, CONTENT_WIDTH, 40);

  // Page 2 — References + Attestation
  const page2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  y = PAGE_HEIGHT - MARGINS.top;

  // Section D — R\u00e9f\u00e9rences
  y = addSection(page2, fonts, 'D \u2013 R\u00c9F\u00c9RENCES PROFESSIONNELLES', y);

  if (profile.references.length > 0) {
    for (const ref of profile.references) {
      y = addLabel(page2, fonts, 'Client', ref.client, MARGINS.left, y);
      y = addLabel(page2, fonts, 'Projet', ref.title, MARGINS.left, y);

      const refDetailY = y;
      addLabel(page2, fonts, 'Montant', ref.amount, MARGINS.left, refDetailY);
      y = addLabel(page2, fonts, 'P\u00e9riode', ref.period, MARGINS.left + halfWidth + 16, refDetailY);

      y -= 6;
      page2.drawLine({
        start: { x: MARGINS.left, y: y + 4 },
        end: { x: PAGE_WIDTH - MARGINS.right, y: y + 4 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });
      y -= 4;
    }
  } else {
    y = addParagraph(page2, fonts, 'Aucune r\u00e9f\u00e9rence renseign\u00e9e dans le profil.', MARGINS.left, y, CONTENT_WIDTH);
  }

  y -= 10;

  // Additional reference fields (editable)
  y = addLabeledField(page2, form, fonts, 'R\u00e9f\u00e9rence suppl\u00e9mentaire (client, objet, montant)', 'ref_supplementaire', '', MARGINS.left, y, CONTENT_WIDTH, 40);
  y -= 6;

  // Section E — Qualifications
  y = addSection(page2, fonts, 'E \u2013 CERTIFICATIONS ET QUALIFICATIONS', y);

  const certs = profile.team.flatMap((m) => m.certifications);
  const certsText = certs.length > 0
    ? `Certifications d\u00e9tenues par l'\u00e9quipe : ${certs.join(', ')}`
    : 'Aucune certification renseign\u00e9e.';
  y = addParagraph(page2, fonts, certsText, MARGINS.left, y, CONTENT_WIDTH);

  y = addLabeledField(page2, form, fonts, 'Autres certifications / qualifications', 'certifications_autres', '', MARGINS.left, y, CONTENT_WIDTH, 30);
  y -= 6;

  // Section F — Attestation
  y = addSection(page2, fonts, 'F \u2013 ATTESTATION SUR L\u2019HONNEUR', y);

  const attestationText = 'Je d\u00e9clare sur l\u2019honneur que les renseignements et documents fournis sont exacts '
    + 'et que le candidat a satisfait \u00e0 l\u2019ensemble de ses obligations fiscales et sociales.';

  y = addParagraph(page2, fonts, attestationText, MARGINS.left, y, CONTENT_WIDTH);
  y -= 16;

  y = addLabeledField(page2, form, fonts, 'Fait \u00e0', 'dc2_fait_a', '', MARGINS.left, y, 200);
  const dateY = y + 30;
  addLabeledField(page2, form, fonts, 'Le (date)', 'dc2_date', '', MARGINS.left + 216, dateY, 200);

  y -= 10;
  y = addLabeledField(page2, form, fonts, 'Nom et qualit\u00e9 du signataire', 'dc2_signataire', '', MARGINS.left, y, CONTENT_WIDTH);
  y = addLabeledField(page2, form, fonts, 'Signature', 'dc2_signature', '', MARGINS.left, y, CONTENT_WIDTH, 50);

  return doc.save();
}
