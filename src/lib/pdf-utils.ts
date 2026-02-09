import { PDFDocument, PDFFont, PDFPage, PDFForm, rgb, degrees, StandardFonts, type Color } from 'pdf-lib';

// ─── Color palette ───
export const C = {
  navy: rgb(0.06, 0.1, 0.25),
  indigo: rgb(0.27, 0.33, 0.76),
  indigoLight: rgb(0.82, 0.84, 0.96),
  darkText: rgb(0.13, 0.13, 0.17),
  mediumText: rgb(0.35, 0.36, 0.42),
  lightText: rgb(0.55, 0.56, 0.62),
  sectionBg: rgb(0.94, 0.95, 0.98),
  tableBorder: rgb(0.82, 0.84, 0.9),
  tableHeaderBg: rgb(0.08, 0.12, 0.28),
  fieldBg: rgb(0.97, 0.97, 0.99),
  divider: rgb(0.88, 0.89, 0.93),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  bleu: rgb(0, 0.14, 0.58),
  rouge: rgb(0.94, 0.16, 0.22),
  successBg: rgb(0.93, 0.98, 0.95),
  successText: rgb(0.13, 0.55, 0.33),
  warnBg: rgb(1, 0.97, 0.92),
  warnText: rgb(0.72, 0.53, 0.1),
};

// ─── A4 page ───
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const M = { left: 50, right: 50, top: 50, bottom: 56 };
export const CW = PAGE_W - M.left - M.right;

export interface PdfFonts { regular: PDFFont; bold: PDFFont }

export async function loadFonts(doc: PDFDocument): Promise<PdfFonts> {
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
}

// ─── Tricolore top stripe ───
function drawTricolore(page: PDFPage): void {
  const h = 5;
  const third = PAGE_W / 3;
  page.drawRectangle({ x: 0, y: PAGE_H - h, width: third, height: h, color: C.bleu });
  page.drawRectangle({ x: third, y: PAGE_H - h, width: third, height: h, color: C.white });
  page.drawRectangle({ x: third * 2, y: PAGE_H - h, width: third + 1, height: h, color: C.rouge });
}

// ─── Page border ───
export function drawPageBorder(page: PDFPage): void {
  const inset = 28;
  page.drawRectangle({
    x: inset, y: inset,
    width: PAGE_W - inset * 2,
    height: PAGE_H - inset * 2,
    borderColor: C.divider,
    borderWidth: 0.5,
    color: undefined as unknown as Color, // transparent fill
  });
}

// ─── Watermark ───
export function drawWatermark(page: PDFPage, fonts: PdfFonts, text: string): void {
  const size = 54;
  const w = fonts.bold.widthOfTextAtSize(text, size);
  page.pushOperators();
  page.drawText(text, {
    x: (PAGE_W - w * 0.7) / 2,
    y: PAGE_H / 2 - 20,
    size,
    font: fonts.bold,
    color: rgb(0.92, 0.93, 0.96),
    rotate: degrees(-30),
  });
}

// ─── Document header (SOTA) ───
export function drawDocHeader(
  page: PDFPage,
  fonts: PdfFonts,
  opts: { docType: string; docTitle: string; issuer?: string; title?: string },
): number {
  drawTricolore(page);
  let y = PAGE_H - M.top - 4;

  // REPUBLIQUE FRANCAISE — centered, spaced
  const rep = 'REPUBLIQUE FRANCAISE';
  const repW = fonts.bold.widthOfTextAtSize(rep, 7);
  page.drawText(rep, { x: (PAGE_W - repW) / 2, y, size: 7, font: fonts.bold, color: C.lightText });
  y -= 5;

  // Thin centered indigo ornament
  const ornW = 40;
  page.drawLine({ start: { x: (PAGE_W - ornW) / 2, y }, end: { x: (PAGE_W + ornW) / 2, y }, thickness: 0.6, color: C.indigo });
  y -= 14;

  // Doc type badge — pill shape
  const badgeText = opts.docType;
  const badgeTextW = fonts.bold.widthOfTextAtSize(badgeText, 10);
  const badgeW = badgeTextW + 28;
  const badgeH = 24;
  const badgeX = (PAGE_W - badgeW) / 2;
  page.drawRectangle({ x: badgeX, y: y - 4, width: badgeW, height: badgeH, color: C.navy });
  // Small indigo underline accent inside badge
  page.drawRectangle({ x: badgeX, y: y - 4, width: badgeW, height: 2.5, color: C.indigo });
  page.drawText(badgeText, {
    x: badgeX + 14,
    y: y + 3,
    size: 10,
    font: fonts.bold,
    color: C.white,
  });
  y -= badgeH + 10;

  // Title
  const titleSize = 14;
  const titleW = fonts.bold.widthOfTextAtSize(opts.docTitle, titleSize);
  page.drawText(opts.docTitle, { x: (PAGE_W - titleW) / 2, y, size: titleSize, font: fonts.bold, color: C.navy });
  y -= 14;

  // Subtitle
  const sub = '(Formulaire non obligatoire)';
  const subW = fonts.regular.widthOfTextAtSize(sub, 7.5);
  page.drawText(sub, { x: (PAGE_W - subW) / 2, y, size: 7.5, font: fonts.regular, color: C.lightText });
  y -= 16;

  // Issuer + market info card (with left indigo bar)
  if (opts.issuer || opts.title) {
    const boxH = (opts.issuer && opts.title) ? 44 : 26;
    const boxY = y - boxH + 14;

    // Background
    page.drawRectangle({ x: M.left, y: boxY, width: CW, height: boxH, color: C.fieldBg, borderColor: C.tableBorder, borderWidth: 0.5 });
    // Left accent bar
    page.drawRectangle({ x: M.left, y: boxY, width: 4, height: boxH, color: C.indigo });

    if (opts.issuer) {
      page.drawText('Acheteur :', { x: M.left + 14, y: boxY + boxH - 14, size: 7.5, font: fonts.bold, color: C.mediumText });
      page.drawText(opts.issuer, { x: M.left + 78, y: boxY + boxH - 14, size: 8.5, font: fonts.regular, color: C.darkText });
    }
    if (opts.title) {
      const objY = opts.issuer ? boxY + boxH - 30 : boxY + boxH - 14;
      page.drawText('Objet :', { x: M.left + 14, y: objY, size: 7.5, font: fonts.bold, color: C.mediumText });
      page.drawText(truncate(opts.title, 82), { x: M.left + 78, y: objY, size: 8.5, font: fonts.regular, color: C.darkText });
    }
    y = boxY - 6;
  }

  // Heavy separator
  page.drawLine({ start: { x: M.left, y }, end: { x: PAGE_W - M.right, y }, thickness: 1.2, color: C.navy });
  page.drawLine({ start: { x: M.left, y: y - 2 }, end: { x: PAGE_W - M.right, y: y - 2 }, thickness: 0.3, color: C.indigo });

  return y - 14;
}

// ─── Section header with letter badge ───
export function drawSection(page: PDFPage, fonts: PdfFonts, title: string, y: number): number {
  const h = 24;
  const barY = y - 3;

  // Background full width
  page.drawRectangle({ x: M.left, y: barY, width: CW, height: h, color: C.sectionBg });

  // Left accent bar (thicker, rounded feel)
  page.drawRectangle({ x: M.left, y: barY, width: 4, height: h, color: C.navy });

  // Extract letter for badge (e.g. "A" from "A – ...")
  const letter = title.charAt(0);
  const badgeSize = 16;
  const badgeCx = M.left + 16;
  const badgeCy = barY + h / 2;

  // Circle badge (approximated with small square)
  page.drawRectangle({
    x: badgeCx - badgeSize / 2,
    y: badgeCy - badgeSize / 2,
    width: badgeSize,
    height: badgeSize,
    color: C.navy,
  });
  const letterW = fonts.bold.widthOfTextAtSize(letter, 9);
  page.drawText(letter, {
    x: badgeCx - letterW / 2,
    y: badgeCy - 3.5,
    size: 9,
    font: fonts.bold,
    color: C.white,
  });

  // Rest of title (after "A ")
  const restTitle = title.length > 2 ? title.slice(1) : '';
  page.drawText(restTitle, {
    x: M.left + 30,
    y: barY + 7,
    size: 9,
    font: fonts.bold,
    color: C.navy,
  });

  return barY - 10;
}

// ─── Continuation header for page 2+ ───
export function drawContinuationHeader(page: PDFPage, fonts: PdfFonts, title: string): number {
  drawTricolore(page);
  let y = PAGE_H - M.top - 4;

  // Left: doc title, right: page indicator
  page.drawText(title, { x: M.left, y, size: 9, font: fonts.bold, color: C.navy });

  y -= 6;
  page.drawLine({ start: { x: M.left, y }, end: { x: PAGE_W - M.right, y }, thickness: 1, color: C.navy });
  page.drawLine({ start: { x: M.left, y: y - 2 }, end: { x: PAGE_W - M.right, y: y - 2 }, thickness: 0.3, color: C.indigo });

  return y - 14;
}

// ─── Field pair (label + value inline) ───
export function drawField(
  page: PDFPage, fonts: PdfFonts, label: string, value: string, x: number, y: number,
  opts?: { labelWidth?: number; valueColor?: Color },
): number {
  const lw = opts?.labelWidth ?? 140;
  page.drawText(label, { x, y, size: 7.5, font: fonts.regular, color: C.lightText });

  // Dotted underline from label end to value
  const dotY = y - 3;
  const labelEnd = x + fonts.regular.widthOfTextAtSize(label, 7.5) + 4;
  for (let dx = labelEnd; dx < x + lw - 4; dx += 4) {
    page.drawRectangle({ x: dx, y: dotY, width: 1, height: 0.4, color: C.divider });
  }

  page.drawText(value || '\u2014', {
    x: x + lw,
    y,
    size: 9,
    font: value ? fonts.bold : fonts.regular,
    color: value ? (opts?.valueColor ?? C.darkText) : C.lightText,
  });
  return y - 18;
}

// ─── Field block (label above value, boxed) ───
export function drawFieldBlock(
  page: PDFPage, fonts: PdfFonts, label: string, value: string, x: number, y: number, width: number,
): number {
  // Box
  page.drawRectangle({ x, y: y - 18, width, height: 32, color: C.fieldBg, borderColor: C.tableBorder, borderWidth: 0.4 });
  // Top mini accent
  page.drawRectangle({ x, y: y + 14, width, height: 1.5, color: C.indigoLight });
  // Label
  page.drawText(label, { x: x + 8, y: y + 3, size: 6.5, font: fonts.regular, color: C.lightText });
  // Value
  page.drawText(value || '\u2014', { x: x + 8, y: y - 11, size: 9, font: value ? fonts.bold : fonts.regular, color: value ? C.darkText : C.lightText });
  return y - 34;
}

// ─── Editable form field ───
export function drawEditableField(
  page: PDFPage, form: PDFForm, fonts: PdfFonts,
  label: string, fieldName: string, x: number, y: number, width: number, height: number = 22,
): number {
  page.drawText(label, { x, y: y + 4, size: 7, font: fonts.regular, color: C.lightText });
  const field = form.createTextField(fieldName);
  field.addToPage(page, {
    x, y: y - height, width, height,
    borderWidth: 0.5,
    borderColor: C.tableBorder,
    backgroundColor: C.fieldBg,
  });
  return y - height - 12;
}

// ─── Table (SOTA: navy header, white text, alternating rows) ───
export interface TableColumn { header: string; width: number; align?: 'left' | 'right' }

export function drawTable(
  page: PDFPage, fonts: PdfFonts, columns: TableColumn[], rows: string[][], x: number, y: number,
): number {
  const rowH = 22;
  const headerH = 24;
  const pad = 8;
  const totalW = columns.reduce((s, c) => s + c.width, 0);

  // Header row — navy background, white text
  page.drawRectangle({ x, y: y - headerH + 8, width: totalW, height: headerH, color: C.tableHeaderBg });

  let colX = x;
  for (const col of columns) {
    page.drawText(col.header, { x: colX + pad, y: y - 7, size: 7.5, font: fonts.bold, color: C.white });
    colX += col.width;
  }

  // Outer border
  const tableH = headerH + rows.length * rowH;
  page.drawRectangle({
    x, y: y + 8 - tableH, width: totalW, height: tableH,
    borderColor: C.tableBorder, borderWidth: 0.6,
    color: undefined as unknown as Color,
  });

  // Vertical dividers
  colX = x;
  for (let i = 1; i < columns.length; i++) {
    colX += columns[i - 1].width;
    page.drawLine({
      start: { x: colX, y: y + 8 },
      end: { x: colX, y: y + 8 - tableH },
      thickness: 0.4, color: C.tableBorder,
    });
  }

  let curY = y - headerH + 8;
  for (let ri = 0; ri < rows.length; ri++) {
    if (ri % 2 === 0) {
      page.drawRectangle({ x: x + 0.3, y: curY - rowH, width: totalW - 0.6, height: rowH, color: C.fieldBg });
    }
    // Bottom border
    page.drawLine({ start: { x, y: curY - rowH }, end: { x: x + totalW, y: curY - rowH }, thickness: 0.3, color: C.tableBorder });

    let cellX = x;
    for (let ci = 0; ci < columns.length; ci++) {
      const text = truncate(rows[ri][ci] || '\u2014', Math.floor(columns[ci].width / 4.2));
      const textX = columns[ci].align === 'right'
        ? cellX + columns[ci].width - pad - fonts.regular.widthOfTextAtSize(text, 8.5)
        : cellX + pad;
      page.drawText(text, {
        x: textX, y: curY - 14, size: 8.5, font: fonts.regular,
        color: rows[ri][ci] ? C.darkText : C.lightText,
      });
      cellX += columns[ci].width;
    }
    curY -= rowH;
  }

  return curY - 8;
}

// ─── Paragraph ───
export function drawParagraph(
  page: PDFPage, fonts: PdfFonts, text: string, x: number, y: number, maxWidth: number,
  opts?: { size?: number; color?: Color; font?: PDFFont; lineHeight?: number },
): number {
  const sz = opts?.size ?? 8.5;
  const ft = opts?.font ?? fonts.regular;
  const cl = opts?.color ?? C.darkText;
  const lh = opts?.lineHeight ?? sz + 4.5;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ft.widthOfTextAtSize(test, sz) > maxWidth && line) {
      page.drawText(line, { x, y: curY, size: sz, font: ft, color: cl });
      curY -= lh;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) { page.drawText(line, { x, y: curY, size: sz, font: ft, color: cl }); curY -= lh; }
  return curY;
}

// ─── Attestation box (bordered, light indigo bg) ───
export function drawAttestationBox(
  page: PDFPage, fonts: PdfFonts, text: string, x: number, y: number, width: number,
): number {
  // Measure height needed
  const sz = 8.5;
  const lh = sz + 4.5;
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (fonts.regular.widthOfTextAtSize(test, sz) > width - 24 && line) { lines++; line = word; }
    else { line = test; }
  }
  if (line) lines++;
  const boxH = lines * lh + 20;

  // Box with left indigo bar
  page.drawRectangle({ x, y: y - boxH + 6, width, height: boxH, color: rgb(0.95, 0.96, 0.99), borderColor: C.indigoLight, borderWidth: 0.6 });
  page.drawRectangle({ x, y: y - boxH + 6, width: 4, height: boxH, color: C.indigo });

  // Icon-like "!" marker
  page.drawRectangle({ x: x + 14, y: y - 5, width: 14, height: 14, color: C.indigo });
  page.drawText('!', { x: x + 18.5, y: y - 2, size: 9, font: fonts.bold, color: C.white });

  // Text
  const textY = drawParagraph(page, fonts, text, x + 36, y - 2, width - 48, { size: sz });

  return y - boxH - 4;
}

// ─── Checkbox ───
export function drawCheckbox(page: PDFPage, fonts: PdfFonts, label: string, checked: boolean, x: number, y: number): number {
  const s = 10;
  page.drawRectangle({ x, y: y - 2, width: s, height: s, borderColor: checked ? C.indigo : C.tableBorder, borderWidth: 0.8, color: checked ? C.indigo : C.white });
  if (checked) {
    page.drawLine({ start: { x: x + 2, y: y + 2 }, end: { x: x + 4, y: y - 1 }, thickness: 1.5, color: C.white });
    page.drawLine({ start: { x: x + 4, y: y - 1 }, end: { x: x + 8, y: y + 6 }, thickness: 1.5, color: C.white });
  }
  page.drawText(label, { x: x + s + 6, y, size: 8, font: fonts.regular, color: C.darkText });
  return y - 18;
}

// ─── Signature block (professional) ───
export function drawSignatureBlock(
  page: PDFPage, form: PDFForm, fonts: PdfFonts, y: number, prefix: string,
): number {
  // "Lu et approuve" mention
  page.drawText('Lu et approuve, bon pour accord', { x: M.left, y: y + 2, size: 7.5, font: fonts.regular, color: C.mediumText });
  y -= 14;

  // Fait a / Le
  const half = (CW - 12) / 2;
  const faitY = y;
  drawEditableField(page, form, fonts, 'Fait a', `${prefix}_fait_a`, M.left, faitY, half);
  drawEditableField(page, form, fonts, 'Le (date)', `${prefix}_date`, M.left + half + 12, faitY, half);
  y = faitY - 38;

  // Signataire
  y = drawEditableField(page, form, fonts, 'Nom et qualite du signataire', `${prefix}_signataire`, M.left, y, CW);

  // Signature — taller, with "Signature" centered above
  page.drawText('Signature', { x: M.left, y: y + 4, size: 7, font: fonts.regular, color: C.lightText });
  const sigField = form.createTextField(`${prefix}_signature`);
  sigField.addToPage(page, {
    x: M.left, y: y - 54, width: CW, height: 54,
    borderWidth: 0.5, borderColor: C.tableBorder, backgroundColor: C.fieldBg,
  });
  y -= 70;

  return y;
}

// ─── Footer (SOTA: with doc type) ───
export function drawFooter(page: PDFPage, fonts: PdfFonts, docType: string, pageNum: number, totalPages: number): void {
  const y = M.bottom - 26;

  page.drawLine({ start: { x: M.left, y: y + 14 }, end: { x: PAGE_W - M.right, y: y + 14 }, thickness: 0.4, color: C.divider });

  // Left — branding
  page.drawText('Le Filon AO', { x: M.left, y, size: 6.5, font: fonts.bold, color: C.lightText });

  // Center — doc type + date
  const center = `${docType}  |  Genere le ${new Date().toLocaleDateString('fr-FR')}`;
  const centerW = fonts.regular.widthOfTextAtSize(center, 6.5);
  page.drawText(center, { x: (PAGE_W - centerW) / 2, y, size: 6.5, font: fonts.regular, color: C.lightText });

  // Right — page
  const pageStr = `${pageNum} / ${totalPages}`;
  const pageW = fonts.regular.widthOfTextAtSize(pageStr, 6.5);
  page.drawText(pageStr, { x: PAGE_W - M.right - pageW, y, size: 6.5, font: fonts.bold, color: C.lightText });
}

// ─── Inline divider between field groups ───
export function drawDivider(page: PDFPage, y: number): number {
  page.drawLine({
    start: { x: M.left + 8, y },
    end: { x: PAGE_W - M.right - 8, y },
    thickness: 0.3,
    color: C.divider,
  });
  return y - 8;
}

// ─── Helpers ───
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text;
}
