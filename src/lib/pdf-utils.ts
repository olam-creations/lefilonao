import { PDFDocument, PDFFont, PDFPage, PDFForm, rgb, StandardFonts, type Color } from 'pdf-lib';

// ─── Color palette ───
export const C = {
  navy: rgb(0.06, 0.1, 0.25),       // #101A40 — headers, titles
  indigo: rgb(0.27, 0.33, 0.76),     // #4554C2 — accents
  darkText: rgb(0.13, 0.13, 0.17),   // #21212B — body text
  mediumText: rgb(0.35, 0.36, 0.42), // #595B6B — secondary text
  lightText: rgb(0.55, 0.56, 0.62),  // #8C8F9E — labels, captions
  sectionBg: rgb(0.94, 0.95, 0.98),  // #F0F1FA — section background
  tableBorder: rgb(0.82, 0.84, 0.9), // #D1D6E6 — table borders
  tableHeaderBg: rgb(0.91, 0.93, 0.98), // #E8EDFA — table header
  fieldBg: rgb(0.97, 0.97, 0.99),    // #F8F8FC — field background
  divider: rgb(0.88, 0.89, 0.93),    // #E0E3ED — thin lines
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  accent: rgb(0.39, 0.4, 0.95),      // matching app indigo
};

// ─── Page dimensions (A4) ───
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const M = { left: 48, right: 48, top: 50, bottom: 60 };
export const CW = PAGE_W - M.left - M.right; // content width

export interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export async function loadFonts(doc: PDFDocument): Promise<PdfFonts> {
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { regular, bold };
}

// ─── Document header ───
// Official-looking header with "REPUBLIQUE FRANCAISE", doc type badge, and reference info
export function drawDocHeader(
  page: PDFPage,
  fonts: PdfFonts,
  opts: { docType: string; docTitle: string; issuer?: string; title?: string },
): number {
  let y = PAGE_H - M.top;

  // Top bar — navy stripe
  page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: C.navy });

  // REPUBLIQUE FRANCAISE — centered, small caps style
  const repText = 'REPUBLIQUE FRANCAISE';
  const repWidth = fonts.bold.widthOfTextAtSize(repText, 7.5);
  page.drawText(repText, {
    x: (PAGE_W - repWidth) / 2,
    y,
    size: 7.5,
    font: fonts.bold,
    color: C.lightText,
  });
  y -= 6;

  // Decorative line — thin centered
  const lineW = 60;
  page.drawLine({
    start: { x: (PAGE_W - lineW) / 2, y },
    end: { x: (PAGE_W + lineW) / 2, y },
    thickness: 0.8,
    color: C.indigo,
  });
  y -= 18;

  // Document type badge
  const badgeText = opts.docType;
  const badgeW = fonts.bold.widthOfTextAtSize(badgeText, 9) + 20;
  const badgeH = 22;
  const badgeX = (PAGE_W - badgeW) / 2;
  page.drawRectangle({
    x: badgeX,
    y: y - 4,
    width: badgeW,
    height: badgeH,
    color: C.navy,
    borderWidth: 0,
  });
  page.drawText(badgeText, {
    x: badgeX + 10,
    y: y + 2,
    size: 9,
    font: fonts.bold,
    color: C.white,
  });
  y -= badgeH + 8;

  // Document title — large, centered
  const titleSize = 13;
  const titleW = fonts.bold.widthOfTextAtSize(opts.docTitle, titleSize);
  page.drawText(opts.docTitle, {
    x: (PAGE_W - titleW) / 2,
    y,
    size: titleSize,
    font: fonts.bold,
    color: C.navy,
  });
  y -= 16;

  // Subtitle — (Formulaire non obligatoire)
  const subText = '(Formulaire non obligatoire)';
  const subW = fonts.regular.widthOfTextAtSize(subText, 7.5);
  page.drawText(subText, {
    x: (PAGE_W - subW) / 2,
    y,
    size: 7.5,
    font: fonts.regular,
    color: C.lightText,
  });
  y -= 14;

  // Issuer + Market info boxes (if provided)
  if (opts.issuer || opts.title) {
    const boxY = y;
    const boxH = opts.title ? 42 : 24;
    page.drawRectangle({
      x: M.left,
      y: boxY - boxH + 12,
      width: CW,
      height: boxH,
      color: C.fieldBg,
      borderColor: C.tableBorder,
      borderWidth: 0.5,
    });

    if (opts.issuer) {
      page.drawText('Acheteur :', { x: M.left + 10, y: boxY, size: 7.5, font: fonts.bold, color: C.mediumText });
      page.drawText(opts.issuer, { x: M.left + 70, y: boxY, size: 8.5, font: fonts.regular, color: C.darkText });
    }
    if (opts.title) {
      const objY = opts.issuer ? boxY - 16 : boxY;
      page.drawText('Objet :', { x: M.left + 10, y: objY, size: 7.5, font: fonts.bold, color: C.mediumText });
      page.drawText(truncate(opts.title, 85), { x: M.left + 70, y: objY, size: 8.5, font: fonts.regular, color: C.darkText });
    }
    y = boxY - boxH + 2;
  }

  // Separator
  y -= 4;
  page.drawLine({
    start: { x: M.left, y },
    end: { x: PAGE_W - M.right, y },
    thickness: 0.8,
    color: C.indigo,
  });

  return y - 14;
}

// ─── Section header ───
// Navy left bar + title, matching French admin style
export function drawSection(page: PDFPage, fonts: PdfFonts, title: string, y: number): number {
  const barH = 22;
  const barY = y - 5;

  // Background
  page.drawRectangle({
    x: M.left,
    y: barY,
    width: CW,
    height: barH,
    color: C.sectionBg,
  });

  // Left accent bar
  page.drawRectangle({
    x: M.left,
    y: barY,
    width: 3.5,
    height: barH,
    color: C.indigo,
  });

  // Title text
  page.drawText(title, {
    x: M.left + 12,
    y: barY + 6,
    size: 9,
    font: fonts.bold,
    color: C.navy,
  });

  return barY - 10;
}

// ─── Field pair (label + value) ───
// Clean inline label/value — no form field, just text
export function drawField(
  page: PDFPage,
  fonts: PdfFonts,
  label: string,
  value: string,
  x: number,
  y: number,
  opts?: { labelWidth?: number; valueColor?: Color },
): number {
  const labelW = opts?.labelWidth ?? 140;
  page.drawText(label, {
    x,
    y,
    size: 7.5,
    font: fonts.regular,
    color: C.lightText,
  });
  page.drawText(value || '—',{
    x: x + labelW,
    y,
    size: 9,
    font: value ? fonts.bold : fonts.regular,
    color: value ? (opts?.valueColor ?? C.darkText) : C.lightText,
  });
  return y - 18;
}

// ─── Compact field (label above value, fixed width) ───
export function drawFieldBlock(
  page: PDFPage,
  fonts: PdfFonts,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): number {
  // Light background box
  page.drawRectangle({
    x,
    y: y - 18,
    width,
    height: 30,
    color: C.fieldBg,
    borderColor: C.tableBorder,
    borderWidth: 0.4,
  });

  // Label
  page.drawText(label, {
    x: x + 6,
    y: y + 2,
    size: 6.5,
    font: fonts.regular,
    color: C.lightText,
  });

  // Value
  page.drawText(value || '—', {
    x: x + 6,
    y: y - 12,
    size: 9,
    font: value ? fonts.bold : fonts.regular,
    color: value ? C.darkText : C.lightText,
  });

  return y - 32;
}

// ─── Editable form field ───
// For fields the user needs to fill in by hand (signature, date, etc.)
export function drawEditableField(
  page: PDFPage,
  form: PDFForm,
  fonts: PdfFonts,
  label: string,
  fieldName: string,
  x: number,
  y: number,
  width: number,
  height: number = 22,
): number {
  page.drawText(label, {
    x,
    y: y + 4,
    size: 7,
    font: fonts.regular,
    color: C.lightText,
  });

  const field = form.createTextField(fieldName);
  field.addToPage(page, {
    x,
    y: y - height,
    width,
    height,
    borderWidth: 0.5,
    borderColor: C.tableBorder,
    backgroundColor: C.fieldBg,
  });

  return y - height - 12;
}

// ─── Table ───
export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right';
}

export function drawTable(
  page: PDFPage,
  fonts: PdfFonts,
  columns: TableColumn[],
  rows: string[][],
  x: number,
  y: number,
): number {
  const rowH = 20;
  const headerH = 22;
  const pad = 8;
  const totalW = columns.reduce((s, c) => s + c.width, 0);

  // Header row
  page.drawRectangle({ x, y: y - headerH + 8, width: totalW, height: headerH, color: C.tableHeaderBg });
  page.drawRectangle({ x, y: y - headerH + 8, width: totalW, height: headerH, borderColor: C.tableBorder, borderWidth: 0.5, color: C.tableHeaderBg });

  let colX = x;
  for (const col of columns) {
    page.drawText(col.header, {
      x: colX + pad,
      y: y - 6,
      size: 7,
      font: fonts.bold,
      color: C.navy,
    });
    colX += col.width;
  }

  // Vertical lines for header
  colX = x;
  for (let i = 0; i <= columns.length; i++) {
    page.drawLine({
      start: { x: colX, y: y + 8 },
      end: { x: colX, y: y - headerH + 8 - rows.length * rowH },
      thickness: 0.5,
      color: C.tableBorder,
    });
    colX += columns[i]?.width ?? 0;
  }

  let currentY = y - headerH + 8;

  // Data rows
  for (let ri = 0; ri < rows.length; ri++) {
    const rowY = currentY;

    // Alternating background
    if (ri % 2 === 1) {
      page.drawRectangle({ x, y: rowY - rowH, width: totalW, height: rowH, color: C.fieldBg });
    }

    // Bottom border
    page.drawLine({
      start: { x, y: rowY - rowH },
      end: { x: x + totalW, y: rowY - rowH },
      thickness: 0.4,
      color: C.tableBorder,
    });

    let cellX = x;
    for (let ci = 0; ci < columns.length; ci++) {
      const text = truncate(rows[ri][ci] || '—', Math.floor(columns[ci].width / 4.5));
      const textX = columns[ci].align === 'right'
        ? cellX + columns[ci].width - pad - fonts.regular.widthOfTextAtSize(text, 8)
        : cellX + pad;

      page.drawText(text, {
        x: textX,
        y: rowY - 13,
        size: 8,
        font: fonts.regular,
        color: rows[ri][ci] ? C.darkText : C.lightText,
      });
      cellX += columns[ci].width;
    }
    currentY -= rowH;
  }

  return currentY - 8;
}

// ─── Paragraph with word wrap ───
export function drawParagraph(
  page: PDFPage,
  fonts: PdfFonts,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  opts?: { size?: number; color?: Color; font?: PDFFont; lineHeight?: number },
): number {
  const size = opts?.size ?? 8.5;
  const font = opts?.font ?? fonts.regular;
  const color = opts?.color ?? C.darkText;
  const lh = opts?.lineHeight ?? size + 4.5;

  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lh;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color });
    currentY -= lh;
  }

  return currentY;
}

// ─── Checkbox ───
export function drawCheckbox(
  page: PDFPage,
  fonts: PdfFonts,
  label: string,
  checked: boolean,
  x: number,
  y: number,
): number {
  const boxSize = 10;
  page.drawRectangle({
    x,
    y: y - 2,
    width: boxSize,
    height: boxSize,
    borderColor: C.tableBorder,
    borderWidth: 0.8,
    color: checked ? C.indigo : C.white,
  });

  if (checked) {
    // Draw checkmark with lines (unicode not supported in standard fonts)
    page.drawLine({ start: { x: x + 2, y: y + 2 }, end: { x: x + 4, y: y - 1 }, thickness: 1.5, color: C.white });
    page.drawLine({ start: { x: x + 4, y: y - 1 }, end: { x: x + 8, y: y + 6 }, thickness: 1.5, color: C.white });
  }

  page.drawText(label, { x: x + boxSize + 6, y, size: 8, font: fonts.regular, color: C.darkText });
  return y - 18;
}

// ─── Footer ───
export function drawFooter(page: PDFPage, fonts: PdfFonts, pageNum: number, totalPages: number): void {
  const y = M.bottom - 28;

  // Separator
  page.drawLine({
    start: { x: M.left, y: y + 14 },
    end: { x: PAGE_W - M.right, y: y + 14 },
    thickness: 0.4,
    color: C.divider,
  });

  // Left — branding
  page.drawText('Le Filon AO', {
    x: M.left,
    y,
    size: 6.5,
    font: fonts.bold,
    color: C.lightText,
  });

  // Center — generation date
  const dateStr = `Document genere le ${new Date().toLocaleDateString('fr-FR')}`;
  const dateW = fonts.regular.widthOfTextAtSize(dateStr, 6.5);
  page.drawText(dateStr, {
    x: (PAGE_W - dateW) / 2,
    y,
    size: 6.5,
    font: fonts.regular,
    color: C.lightText,
  });

  // Right — page number
  const pageStr = `Page ${pageNum}/${totalPages}`;
  const pageW = fonts.regular.widthOfTextAtSize(pageStr, 6.5);
  page.drawText(pageStr, {
    x: PAGE_W - M.right - pageW,
    y,
    size: 6.5,
    font: fonts.regular,
    color: C.lightText,
  });
}

// ─── Helpers ───
function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + '\u2026' : text;
}
