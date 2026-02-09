import { PDFDocument, PDFFont, PDFPage, PDFForm, rgb, StandardFonts } from 'pdf-lib';

export const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.85, 0.85, 0.85),
  blue: rgb(0.05, 0.15, 0.4),
  indigo: rgb(0.39, 0.4, 0.95),
  white: rgb(1, 1, 1),
};

export const MARGINS = { left: 50, right: 50, top: 50, bottom: 50 };
export const PAGE_WIDTH = 595.28; // A4
export const PAGE_HEIGHT = 841.89;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

export interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export async function loadFonts(doc: PDFDocument): Promise<PdfFonts> {
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { regular, bold };
}

export function addHeader(page: PDFPage, fonts: PdfFonts, subtitle: string): number {
  const { bold, regular } = fonts;
  let y = PAGE_HEIGHT - MARGINS.top;

  page.drawText('REPUBLIQUE FRANCAISE', {
    x: MARGINS.left,
    y,
    size: 8,
    font: regular,
    color: COLORS.gray,
  });

  y -= 20;
  page.drawText(subtitle, {
    x: MARGINS.left,
    y,
    size: 14,
    font: bold,
    color: COLORS.blue,
  });

  y -= 14;
  page.drawText('(Formulaire non obligatoire)', {
    x: MARGINS.left,
    y,
    size: 8,
    font: regular,
    color: COLORS.gray,
  });

  y -= 8;
  page.drawLine({
    start: { x: MARGINS.left, y },
    end: { x: PAGE_WIDTH - MARGINS.right, y },
    thickness: 1,
    color: COLORS.lightGray,
  });

  return y - 16;
}

export function addSection(page: PDFPage, fonts: PdfFonts, title: string, y: number): number {
  page.drawRectangle({
    x: MARGINS.left,
    y: y - 4,
    width: CONTENT_WIDTH,
    height: 20,
    color: rgb(0.94, 0.95, 1),
  });

  page.drawText(title, {
    x: MARGINS.left + 8,
    y: y + 2,
    size: 10,
    font: fonts.bold,
    color: COLORS.blue,
  });

  return y - 26;
}

export function addLabeledField(
  page: PDFPage,
  form: PDFForm,
  fonts: PdfFonts,
  label: string,
  fieldName: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number = 20,
): number {
  page.drawText(label, {
    x,
    y: y + 4,
    size: 8,
    font: fonts.regular,
    color: COLORS.gray,
  });

  const field = form.createTextField(fieldName);
  field.addToPage(page, {
    x,
    y: y - height,
    width,
    height,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  });

  if (value) {
    field.setText(value);
  }

  return y - height - 10;
}

export function addLabel(
  page: PDFPage,
  fonts: PdfFonts,
  label: string,
  value: string,
  x: number,
  y: number,
): number {
  page.drawText(label, {
    x,
    y,
    size: 8,
    font: fonts.regular,
    color: COLORS.gray,
  });

  page.drawText(value, {
    x,
    y: y - 14,
    size: 10,
    font: fonts.bold,
    color: COLORS.darkGray,
  });

  return y - 30;
}

export function addParagraph(
  page: PDFPage,
  fonts: PdfFonts,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = 9,
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const textWidth = fonts.regular.widthOfTextAtSize(testLine, fontSize);

    if (textWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font: fonts.regular, color: COLORS.darkGray });
      currentY -= fontSize + 4;
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size: fontSize, font: fonts.regular, color: COLORS.darkGray });
    currentY -= fontSize + 4;
  }

  return currentY;
}
