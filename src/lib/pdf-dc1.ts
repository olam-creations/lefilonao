import { PDFDocument } from 'pdf-lib';
import type { CompanyProfile } from './dev';
import {
  loadFonts,
  addHeader,
  addSection,
  addLabeledField,
  addParagraph,
  MARGINS,
  CONTENT_WIDTH,
  PAGE_WIDTH,
  PAGE_HEIGHT,
} from './pdf-utils';

interface Dc1Input {
  profile: CompanyProfile;
  issuer: string;
  title: string;
}

export async function generateDC1({ profile, issuer, title }: Dc1Input): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const form = doc.getForm();

  let y = addHeader(page, fonts, 'DC1 \u2013 Lettre de candidature');

  // Section A — Objet de la consultation
  y = addSection(page, fonts, 'A \u2013 OBJET DE LA CONSULTATION', y);

  y = addLabeledField(page, form, fonts, 'Acheteur public', 'acheteur', issuer, MARGINS.left, y, CONTENT_WIDTH);
  y = addLabeledField(page, form, fonts, 'Objet du march\u00e9', 'objet', title, MARGINS.left, y, CONTENT_WIDTH, 30);
  y = addLabeledField(page, form, fonts, 'N\u00b0 de lot (le cas \u00e9ch\u00e9ant)', 'numero_lot', '', MARGINS.left, y, 200);
  y -= 6;

  // Section B — Identification du candidat
  y = addSection(page, fonts, 'B \u2013 IDENTIFICATION DU CANDIDAT', y);

  const halfWidth = (CONTENT_WIDTH - 16) / 2;

  y = addLabeledField(page, form, fonts, 'D\u00e9nomination / Raison sociale', 'denomination', profile.companyName, MARGINS.left, y, CONTENT_WIDTH);
  y = addLabeledField(page, form, fonts, 'N\u00b0 SIRET', 'siret', profile.siret, MARGINS.left, y, halfWidth);

  const formJurY = y + 30;
  addLabeledField(page, form, fonts, 'Forme juridique', 'forme_juridique', profile.legalForm, MARGINS.left + halfWidth + 16, formJurY, halfWidth);

  y = addLabeledField(page, form, fonts, 'Adresse', 'adresse', profile.address, MARGINS.left, y, CONTENT_WIDTH);

  y = addLabeledField(page, form, fonts, 'Code postal', 'code_postal', profile.postalCode, MARGINS.left, y, 120);
  const villeY = y + 30;
  addLabeledField(page, form, fonts, 'Ville', 'ville', profile.city, MARGINS.left + 136, villeY, halfWidth);

  y = addLabeledField(page, form, fonts, 'T\u00e9l\u00e9phone', 'telephone', '', MARGINS.left, y, halfWidth);
  const emailY = y + 30;
  addLabeledField(page, form, fonts, 'Courriel', 'courriel', '', MARGINS.left + halfWidth + 16, emailY, halfWidth);

  y -= 6;

  // Section C — Type de candidature
  y = addSection(page, fonts, 'C \u2013 TYPE DE CANDIDATURE', y);

  y = addLabeledField(page, form, fonts, 'Candidature (individuelle / groupement)', 'type_candidature', 'Candidature individuelle', MARGINS.left, y, CONTENT_WIDTH);
  y -= 6;

  // Section D — Engagement
  y = addSection(page, fonts, 'D \u2013 ENGAGEMENT DU CANDIDAT', y);

  const engagementText = 'Le candidat atteste sur l\u2019honneur : '
    + '(a) ne pas entrer dans l\u2019un des cas d\u2019interdiction de soumissionner pr\u00e9vus aux articles L.2141-1 \u00e0 L.2141-5 '
    + 'et L.2141-7 \u00e0 L.2141-11 du Code de la commande publique ; '
    + '(b) \u00eatre en r\u00e8gle au regard des articles L.5212-1 \u00e0 L.5212-11 du Code du travail '
    + 'concernant l\u2019emploi des travailleurs handicap\u00e9s.';

  y = addParagraph(page, fonts, engagementText, MARGINS.left, y, CONTENT_WIDTH);
  y -= 16;

  y = addLabeledField(page, form, fonts, 'Fait \u00e0', 'fait_a', '', MARGINS.left, y, 200);
  const dateY = y + 30;
  addLabeledField(page, form, fonts, 'Le (date)', 'date_signature', '', MARGINS.left + 216, dateY, 200);

  y -= 10;
  y = addLabeledField(page, form, fonts, 'Nom et qualit\u00e9 du signataire', 'signataire', '', MARGINS.left, y, CONTENT_WIDTH);
  y = addLabeledField(page, form, fonts, 'Signature', 'signature', '', MARGINS.left, y, CONTENT_WIDTH, 50);

  return doc.save();
}
