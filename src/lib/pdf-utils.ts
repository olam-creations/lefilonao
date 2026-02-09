import { PDFDocument, PDFFont, PDFPage, PDFForm, PDFImage, rgb, StandardFonts, type Color } from 'pdf-lib';

/*
 * COORDINATE SYSTEM:
 * - y = top of the current element to draw
 * - All drawing goes DOWNWARD from y
 * - Every function returns the y for the NEXT element below (with gap included)
 * - No element ever paints ABOVE the y passed in
 */

// ─── Palette — muted, professional ───
export const C = {
  black: rgb(0.12, 0.12, 0.14),
  dark: rgb(0.22, 0.23, 0.27),
  mid: rgb(0.44, 0.45, 0.5),
  light: rgb(0.62, 0.63, 0.67),
  rule: rgb(0.8, 0.81, 0.84),
  ruleLight: rgb(0.89, 0.9, 0.92),
  fill: rgb(0.955, 0.96, 0.97),
  white: rgb(1, 1, 1),
  accent: rgb(0.18, 0.25, 0.42),
  accentBg: rgb(0.92, 0.935, 0.96),
  stripe: rgb(0.97, 0.975, 0.98),
};

// ─── A4 dimensions ───
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const M = { left: 56, right: 56, top: 56, bottom: 48 };
export const CW = PAGE_W - M.left - M.right;

export interface PdfFonts { regular: PDFFont; bold: PDFFont; italic: PDFFont }

export async function loadFonts(doc: PDFDocument): Promise<PdfFonts> {
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
}

export interface ESignData {
  name: string;
  title: string;
  email: string;
  city?: string;
  date?: Date;           // defaults to now
  transactionId?: string; // auto-generated if absent
}

// ═══════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════

export function drawDocHeader(
  page: PDFPage, fonts: PdfFonts,
  opts: { docType: string; docTitle: string; issuer?: string; title?: string },
): number {
  // Accent bar at very top
  page.drawRectangle({ x: M.left, y: PAGE_H - M.top + 8, width: CW, height: 2.5, color: C.accent });

  let y = PAGE_H - M.top;

  // Category left + form ref right
  page.drawText('MARCH\u00c9S PUBLICS', { x: M.left, y, size: 6.5, font: fonts.regular, color: C.mid });
  const refTxt = `FORMULAIRE ${opts.docType}`;
  const refW = fonts.bold.widthOfTextAtSize(refTxt, 7.5);
  page.drawText(refTxt, { x: PAGE_W - M.right - refW, y, size: 7.5, font: fonts.bold, color: C.light });
  y -= 14;

  // Title band with accent background
  const bandH = 28;
  page.drawRectangle({ x: M.left, y: y - bandH, width: CW, height: bandH, color: C.accentBg });
  page.drawRectangle({ x: M.left, y: y - bandH, width: 3, height: bandH, color: C.accent });
  page.drawText(opts.docTitle, { x: M.left + 12, y: y - bandH + 10, size: 16, font: fonts.bold, color: C.accent });
  y -= bandH + 8;

  // Issuer with label
  if (opts.issuer) {
    page.drawText('Acheteur', { x: M.left, y: y - 9, size: 7, font: fonts.regular, color: C.mid });
    page.drawText(opts.issuer, { x: M.left + 52, y: y - 9, size: 9, font: fonts.regular, color: C.dark });
    y -= 15;
  }
  // Market object with label
  if (opts.title) {
    page.drawText('Objet', { x: M.left, y: y - 9, size: 7, font: fonts.regular, color: C.mid });
    page.drawText(truncate(opts.title, 88), { x: M.left + 52, y: y - 9, size: 9, font: fonts.regular, color: C.mid });
    y -= 15;
  }

  y -= 2;

  // Double rule — accent
  page.drawRectangle({ x: M.left, y, width: CW, height: 1.5, color: C.accent });
  page.drawLine({ start: { x: M.left, y: y - 3.5 }, end: { x: PAGE_W - M.right, y: y - 3.5 }, thickness: 0.3, color: C.rule });
  y -= 14;

  return y;
}

export function drawContinuationHeader(page: PDFPage, fonts: PdfFonts, docType: string, docTitle: string): number {
  page.drawRectangle({ x: M.left, y: PAGE_H - M.top + 8, width: CW, height: 2.5, color: C.accent });

  let y = PAGE_H - M.top;
  page.drawText(`${docType} \u2014 ${docTitle}`, { x: M.left, y, size: 8, font: fonts.bold, color: C.mid });

  const tag = '(suite)';
  const tagW = fonts.regular.widthOfTextAtSize(tag, 7.5);
  page.drawText(tag, { x: PAGE_W - M.right - tagW, y, size: 7.5, font: fonts.regular, color: C.light });
  y -= 10;

  page.drawRectangle({ x: M.left, y, width: CW, height: 1.5, color: C.accent });
  page.drawLine({ start: { x: M.left, y: y - 3.5 }, end: { x: PAGE_W - M.right, y: y - 3.5 }, thickness: 0.3, color: C.rule });
  y -= 14;

  return y;
}

// ═══════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════

export function drawSection(page: PDFPage, fonts: PdfFonts, title: string, y: number): number {
  const dashIdx = title.indexOf('\u2013');
  const letter = dashIdx > 0 ? title.slice(0, dashIdx).trim() : '';
  const label = dashIdx > 0 ? title.slice(dashIdx + 1).trim() : title;

  y -= 6; // top margin

  const stripH = 20;
  const badgeW = 26;

  // Full-width background strip
  page.drawRectangle({ x: M.left, y: y - stripH, width: CW, height: stripH, color: C.fill });

  if (letter) {
    // Accent badge tab
    page.drawRectangle({ x: M.left, y: y - stripH, width: badgeW, height: stripH, color: C.accent });
    const lw = fonts.bold.widthOfTextAtSize(letter, 10);
    page.drawText(letter, {
      x: M.left + (badgeW - lw) / 2, y: y - stripH + 6,
      size: 10, font: fonts.bold, color: C.white,
    });
  }
  const textX = letter ? M.left + badgeW + 10 : M.left + 8;
  page.drawText(label, { x: textX, y: y - stripH + 6, size: 8.5, font: fonts.bold, color: C.black });

  y -= stripH;
  // Bottom accent line
  page.drawLine({ start: { x: M.left, y }, end: { x: PAGE_W - M.right, y }, thickness: 0.6, color: C.accent });
  y -= 8;

  return y;
}

// ═══════════════════════════════════════════
// FIELDS
// ═══════════════════════════════════════════

/** Single field: label .... value on one line */
export function drawField(
  page: PDFPage, fonts: PdfFonts, label: string, value: string,
  x: number, y: number, opts?: { labelWidth?: number },
): number {
  const lw = opts?.labelWidth ?? 155;

  page.drawText(label, { x, y: y - 9, size: 7.5, font: fonts.regular, color: C.mid });
  page.drawText(value || '\u2014', {
    x: x + lw, y: y - 9, size: 9,
    font: value ? fonts.bold : fonts.regular,
    color: value ? C.black : C.light,
  });
  page.drawLine({ start: { x, y: y - 14 }, end: { x: x + CW, y: y - 14 }, thickness: 0.15, color: C.ruleLight });

  return y - 20;
}

/** Field block: label above, value inside a box */
export function drawFieldBlock(
  page: PDFPage, fonts: PdfFonts, label: string, value: string,
  x: number, y: number, width: number,
): void {
  // Label
  page.drawText(label, { x: x + 1, y: y - 8, size: 6.5, font: fonts.regular, color: C.mid });
  // Box below label
  const boxTop = y - 14;
  const boxH = 22;
  page.drawRectangle({ x, y: boxTop - boxH, width, height: boxH, color: C.fill, borderColor: C.rule, borderWidth: 0.4 });
  // Value centered in box
  page.drawText(value || '\u2014', {
    x: x + 8, y: boxTop - boxH + 7, size: 9,
    font: value ? fonts.bold : fonts.regular,
    color: value ? C.black : C.light,
  });
}

/** Returns y after a row of field blocks (call after drawing blocks at same y) */
export function afterFieldBlocks(y: number): number {
  // label ~8 + gap 6 + box 22 + gap 6 = 42
  return y - 42;
}

/** Editable PDF form field */
export function drawEditableField(
  page: PDFPage, form: PDFForm, fonts: PdfFonts,
  label: string, fieldName: string,
  x: number, y: number, width: number, height: number = 22,
): number {
  page.drawText(label, { x, y: y - 8, size: 7, font: fonts.regular, color: C.mid });
  const field = form.createTextField(fieldName);
  const boxTop = y - 14;
  field.addToPage(page, {
    x, y: boxTop - height, width, height,
    borderWidth: 0.4, borderColor: C.rule, backgroundColor: C.fill,
  });
  return boxTop - height - 8;
}

// ═══════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════

export interface TableColumn { header: string; width: number; align?: 'left' | 'right' }

export function drawTable(
  page: PDFPage, fonts: PdfFonts, columns: TableColumn[], rows: string[][],
  x: number, y: number,
): number {
  const hdrH = 20;
  const rowH = 20;
  const pad = 7;
  const totalW = columns.reduce((s, c) => s + c.width, 0);

  // Header
  const hdrTop = y;
  page.drawRectangle({ x, y: hdrTop - hdrH, width: totalW, height: hdrH, color: C.accent });

  let cx = x;
  for (const col of columns) {
    const tx = col.align === 'right'
      ? cx + col.width - pad - fonts.bold.widthOfTextAtSize(col.header, 7)
      : cx + pad;
    page.drawText(col.header, { x: tx, y: hdrTop - hdrH + 6, size: 7, font: fonts.bold, color: C.white });
    cx += col.width;
  }

  // Rows
  let rowTop = hdrTop - hdrH;
  for (let ri = 0; ri < rows.length; ri++) {
    if (ri % 2 === 0) {
      page.drawRectangle({ x, y: rowTop - rowH, width: totalW, height: rowH, color: C.stripe });
    }
    page.drawLine({ start: { x, y: rowTop - rowH }, end: { x: x + totalW, y: rowTop - rowH }, thickness: 0.15, color: C.rule });

    cx = x;
    for (let ci = 0; ci < columns.length; ci++) {
      const txt = truncate(rows[ri][ci] || '\u2014', Math.floor(columns[ci].width / 4.2));
      const tx = columns[ci].align === 'right'
        ? cx + columns[ci].width - pad - fonts.regular.widthOfTextAtSize(txt, 8)
        : cx + pad;
      page.drawText(txt, { x: tx, y: rowTop - rowH + 6, size: 8, font: fonts.regular, color: rows[ri][ci] ? C.black : C.light });
      cx += columns[ci].width;
    }
    rowTop -= rowH;
  }

  // Outer border
  const tableH = hdrH + rows.length * rowH;
  page.drawRectangle({ x, y: hdrTop - tableH, width: totalW, height: tableH, borderColor: C.rule, borderWidth: 0.4, color: undefined as unknown as Color });

  // Column dividers
  cx = x;
  for (let i = 1; i < columns.length; i++) {
    cx += columns[i - 1].width;
    page.drawLine({ start: { x: cx, y: hdrTop }, end: { x: cx, y: hdrTop - tableH }, thickness: 0.15, color: C.rule });
  }

  return hdrTop - tableH - 8;
}

// ═══════════════════════════════════════════
// TEXT
// ═══════════════════════════════════════════

export function drawParagraph(
  page: PDFPage, fonts: PdfFonts, text: string,
  x: number, y: number, maxWidth: number,
  opts?: { size?: number; color?: Color; font?: PDFFont; lineHeight?: number },
): number {
  const sz = opts?.size ?? 8.5;
  const ft = opts?.font ?? fonts.regular;
  const cl = opts?.color ?? C.dark;
  const lh = opts?.lineHeight ?? sz + 4;

  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ft.widthOfTextAtSize(test, sz) > maxWidth && line) {
      page.drawText(line, { x, y: curY - sz, size: sz, font: ft, color: cl });
      curY -= lh;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: curY - sz, size: sz, font: ft, color: cl });
    curY -= lh;
  }
  return curY;
}

// ═══════════════════════════════════════════
// SPECIAL BLOCKS
// ═══════════════════════════════════════════

export function drawAttestationBox(
  page: PDFPage, fonts: PdfFonts, text: string,
  x: number, y: number, width: number,
): number {
  const sz = 8.5;
  const lh = sz + 4;
  const pad = 10;
  const innerW = width - pad * 2;

  // Pre-measure height
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (fonts.regular.widthOfTextAtSize(test, sz) > innerW && line) { lineCount++; line = word; }
    else { line = test; }
  }
  if (line) lineCount++;
  const boxH = lineCount * lh + pad * 2;

  // Box
  page.drawRectangle({ x, y: y - boxH, width, height: boxH, color: C.accentBg, borderColor: C.rule, borderWidth: 0.3 });
  page.drawRectangle({ x, y: y - boxH, width: 3, height: boxH, color: C.accent });

  // Text
  drawParagraph(page, fonts, text, x + pad, y - pad + 4, innerW, { size: sz, color: C.dark });

  return y - boxH - 6;
}

export function drawCheckbox(page: PDFPage, fonts: PdfFonts, label: string, checked: boolean, x: number, y: number): number {
  const s = 9;
  const boxY = y - s - 1;

  page.drawRectangle({
    x, y: boxY, width: s, height: s,
    borderColor: checked ? C.accent : C.rule, borderWidth: 0.6,
    color: checked ? C.accent : C.white,
  });

  if (checked) {
    const bx = x;
    const by = boxY;
    page.drawLine({ start: { x: bx + 2, y: by + 5 }, end: { x: bx + 3.5, y: by + 2 }, thickness: 1.2, color: C.white });
    page.drawLine({ start: { x: bx + 3.5, y: by + 2 }, end: { x: bx + 7, y: by + 7 }, thickness: 1.2, color: C.white });
  }

  page.drawText(label, { x: x + s + 6, y: boxY + 2, size: 8, font: fonts.regular, color: C.black });
  return y - s - 7;
}

// ═══════════════════════════════════════════
// SIGNATURE
// ═══════════════════════════════════════════

export function drawSignatureBlock(
  page: PDFPage, form: PDFForm, fonts: PdfFonts, y: number, prefix: string,
  cachetImage?: PDFImage,
): number {
  // Light separator
  page.drawLine({ start: { x: M.left, y: y - 2 }, end: { x: PAGE_W - M.right, y: y - 2 }, thickness: 0.3, color: C.rule });
  y -= 10;

  const half = (CW - 16) / 2;
  const leftY = drawEditableField(page, form, fonts, 'Fait a', `${prefix}_fait_a`, M.left, y, half);
  drawEditableField(page, form, fonts, 'Le (date)', `${prefix}_date`, M.left + half + 16, y, half);
  y = leftY;

  y = drawEditableField(page, form, fonts, 'Nom et qualite du signataire', `${prefix}_signataire`, M.left, y, CW);

  // Signature + Cachet side by side
  const sigW = Math.floor(CW * 0.58);
  const gutter = 12;
  const cachetW = CW - sigW - gutter;
  const areaH = 36;

  page.drawText('Signature', { x: M.left, y: y - 8, size: 7, font: fonts.regular, color: C.mid });
  const sigField = form.createTextField(`${prefix}_signature`);
  sigField.addToPage(page, {
    x: M.left, y: y - 14 - areaH, width: sigW, height: areaH,
    borderWidth: 0.4, borderColor: C.rule, backgroundColor: C.fill,
  });

  const cachetX = M.left + sigW + gutter;
  page.drawText('Cachet de l\u2019entreprise', { x: cachetX, y: y - 8, size: 7, font: fonts.regular, color: C.mid });
  page.drawRectangle({
    x: cachetX, y: y - 14 - areaH, width: cachetW, height: areaH,
    color: C.fill, borderColor: C.rule, borderWidth: 0.4,
  });

  if (cachetImage) {
    const imgDims = cachetImage.scaleToFit(cachetW - 8, areaH - 8);
    page.drawImage(cachetImage, {
      x: cachetX + (cachetW - imgDims.width) / 2,
      y: y - 14 - areaH + (areaH - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
    });
  }

  return y - 14 - areaH - 8;
}

/**
 * Electronic signature block (LegalPlace / Yousign / DocuSign style).
 *
 * Elements (based on industry standards):
 * - Header "SIGNATURE ELECTRONIQUE"
 * - Signer name in italic (signature-like)
 * - Signer title + email
 * - Date/time + city ("Fait a …")
 * - Transaction reference ID (audit trail)
 * - Checkmark + "Certifie via Le Filon AO"
 * - Legal mention (art. 1367 Code civil)
 * - Cachet area on the right
 */
export function drawESignatureBlock(
  page: PDFPage, fonts: PdfFonts, esign: ESignData, y: number,
  cachetImage?: PDFImage,
): number {
  // Separator
  page.drawLine({ start: { x: M.left, y: y - 2 }, end: { x: PAGE_W - M.right, y: y - 2 }, thickness: 0.3, color: C.rule });
  y -= 10;

  // Date formatting
  const d = esign.date ?? new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const datePart = esign.city
    ? `Fait \u00e0 ${esign.city}, le ${dd}/${mm}/${yyyy} \u00e0 ${hh}:${min}`
    : `Le ${dd}/${mm}/${yyyy} \u00e0 ${hh}:${min}`;

  // Transaction ID (auto-generated if absent)
  const txId = esign.transactionId
    ?? `LFAO-${yyyy}${mm}${dd}-${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}`;

  // Layout
  const sigW = Math.floor(CW * 0.6);
  const gutter = 12;
  const cachetW = CW - sigW - gutter;
  const pad = 12;
  const barW = 3;
  const innerW = sigW - pad - barW - 8;

  // Pre-measure legal text to compute exact box height
  const legalText = 'Ce document a \u00e9t\u00e9 sign\u00e9 \u00e9lectroniquement'
    + ' conform\u00e9ment \u00e0 l\u2019article 1367 du Code civil.';
  const legalSz = 6;
  const legalLh = 8.5;
  const legalLines = countLines(fonts.regular, legalText, legalSz, innerW);

  // Total height = fixed content (118) + legal paragraph + bottom padding
  const areaH = Math.ceil(118 + legalLines * legalLh);
  const boxY = y - areaH;
  const cx = M.left + pad;

  // ── Certificate box background ──
  page.drawRectangle({ x: M.left, y: boxY, width: sigW, height: areaH, color: C.accentBg, borderColor: C.rule, borderWidth: 0.3 });
  page.drawRectangle({ x: M.left, y: boxY, width: barW, height: areaH, color: C.accent });

  let cy = y;

  // Header
  cy -= 8;
  page.drawText('SIGNATURE \u00c9LECTRONIQUE', {
    x: cx, y: cy - 6.5, size: 6.5, font: fonts.bold, color: C.mid,
  });
  cy -= 10;
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + 120, y: cy }, thickness: 0.3, color: C.rule });

  // ── Identity block ──
  // Signer name (italic, large, accent — signature-like)
  cy -= 6;
  page.drawText(esign.name, {
    x: cx, y: cy - 14, size: 14, font: fonts.italic, color: C.accent,
  });
  // Signer title
  cy -= 20;
  page.drawText(esign.title, {
    x: cx, y: cy - 8.5, size: 8.5, font: fonts.regular, color: C.dark,
  });
  // Signer email
  cy -= 12;
  page.drawText(esign.email, {
    x: cx, y: cy - 7, size: 7, font: fonts.regular, color: C.light,
  });

  // ── Info separator ──
  cy -= 11;
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + innerW, y: cy }, thickness: 0.15, color: C.ruleLight });

  // Date/time + city
  cy -= 8;
  page.drawText(datePart, {
    x: cx, y: cy - 7.5, size: 7.5, font: fonts.regular, color: C.mid,
  });
  // Transaction reference
  cy -= 10;
  page.drawText(`R\u00e9f. : ${txId}`, {
    x: cx, y: cy - 6.5, size: 6.5, font: fonts.regular, color: C.light,
  });

  // Checkmark + certification badge
  cy -= 9;
  const ckX = cx;
  const ckY = cy - 7;
  const ckS = 7;
  page.drawRectangle({ x: ckX, y: ckY, width: ckS, height: ckS, borderColor: C.accent, borderWidth: 0.5, color: C.accent });
  page.drawLine({ start: { x: ckX + 1.5, y: ckY + 3.8 }, end: { x: ckX + 2.8, y: ckY + 1.5 }, thickness: 1, color: C.white });
  page.drawLine({ start: { x: ckX + 2.8, y: ckY + 1.5 }, end: { x: ckX + 5.5, y: ckY + 5.5 }, thickness: 1, color: C.white });
  page.drawText('Certifi\u00e9 via Le Filon AO', {
    x: ckX + ckS + 5, y: ckY + 1, size: 7.5, font: fonts.regular, color: C.mid,
  });

  // ── Legal separator ──
  cy -= 12;
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + innerW, y: cy }, thickness: 0.15, color: C.ruleLight });

  // Legal mention (wrapped paragraph)
  cy -= 6;
  const words = legalText.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (fonts.regular.widthOfTextAtSize(test, legalSz) > innerW && line) {
      page.drawText(line, { x: cx, y: cy - legalSz, size: legalSz, font: fonts.regular, color: C.light });
      cy -= legalLh;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x: cx, y: cy - legalSz, size: legalSz, font: fonts.regular, color: C.light });
  }

  // ── Cachet area (right) ──
  const cachetX = M.left + sigW + gutter;
  const cachetH = areaH - 14;
  page.drawText('Cachet de l\u2019entreprise', { x: cachetX, y: y - 8, size: 7, font: fonts.regular, color: C.mid });
  page.drawRectangle({
    x: cachetX, y: boxY, width: cachetW, height: cachetH,
    color: C.fill, borderColor: C.rule, borderWidth: 0.4,
  });

  if (cachetImage) {
    const imgDims = cachetImage.scaleToFit(cachetW - 8, cachetH - 8);
    page.drawImage(cachetImage, {
      x: cachetX + (cachetW - imgDims.width) / 2,
      y: boxY + (cachetH - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
    });
  }

  return boxY - 8;
}

// ═══════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════

export function drawFooter(page: PDFPage, fonts: PdfFonts, docType: string, pageNum: number, totalPages: number): void {
  const y = M.bottom - 16;
  page.drawLine({ start: { x: M.left, y: y + 8 }, end: { x: PAGE_W - M.right, y: y + 8 }, thickness: 0.2, color: C.ruleLight });
  const s = `${docType} \u2014 ${pageNum} / ${totalPages}`;
  const w = fonts.regular.widthOfTextAtSize(s, 7);
  page.drawText(s, { x: (PAGE_W - w) / 2, y, size: 7, font: fonts.regular, color: C.light });
}

// ═══════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════

export function drawDivider(page: PDFPage, y: number): number {
  page.drawLine({ start: { x: M.left, y: y - 2 }, end: { x: PAGE_W - M.right, y: y - 2 }, thickness: 0.15, color: C.ruleLight });
  return y - 8;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text;
}

function countLines(font: PDFFont, text: string, size: number, maxWidth: number): number {
  const words = text.split(' ');
  let line = '';
  let count = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) { count++; line = w; }
    else { line = test; }
  }
  if (line) count++;
  return count;
}

export function base64ToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
