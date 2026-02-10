/**
 * Moteur d'extraction PDF haute fidelite.
 * Remplace pdf-parse par une extraction spatiale via pdfjs-dist.
 *
 * Uses lazy dynamic import to avoid crashing the module at load time
 * in Vercel's serverless environment where pdfjs-dist .mjs bundle
 * may not be resolved correctly at top-level.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pdfjs: any = null;

async function getPdfjs() {
  if (!_pdfjs) {
    _pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (typeof window === 'undefined') {
      _pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
    }
  }
  return _pdfjs;
}

export interface PdfContent {
  text: string;
  metadata: any;
  numPages: number;
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  pageNumber: number;
}

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
}

/**
 * Extrait le texte d'un PDF en preservant grossierement le layout spatial.
 * Cela aide l'IA a comprendre les tableaux et les structures de listes.
 */
export async function extractHighFidelityText(buffer: Buffer): Promise<PdfContent> {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  let fullText = '';
  const numPages = doc.numPages;
  const Y_THRESHOLD = 3; // Marge de tolerance en pixels pour considerer deux items sur la meme ligne

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Sort items by vertical position (Y descending) then horizontal (X ascending)
    const items = (content.items as Array<{ str: string; transform: number[] }>)
      .filter((item) => 'transform' in item && 'str' in item)
      .sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > Y_THRESHOLD) return yDiff;
        return a.transform[4] - b.transform[4];
      });

    let lastY = -1;
    let pageText = '';

    for (const item of items) {
      const currentY = item.transform[5];
      if (lastY !== -1 && Math.abs(lastY - currentY) > Y_THRESHOLD) {
        pageText += '\n';
      } else if (lastY !== -1) {
        pageText += '   '; // Simule des colonnes de tableau
      }
      pageText += item.str;
      lastY = currentY;
    }

    fullText += `--- PAGE ${i} ---
${pageText}

`;
  }
  const metadata = await doc.getMetadata().catch(() => ({}));

  return {
    text: fullText,
    metadata,
    numPages
  };
}

/**
 * Extract tables from a PDF buffer using spatial heuristics.
 * Groups items by Y position into rows, detects consistent column counts across 3+ rows.
 */
export async function extractTablesFromPdf(buffer: Buffer): Promise<ExtractedTable[]> {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  const tables: ExtractedTable[] = [];
  const ROW_Y_THRESHOLD = 3;
  const MIN_COLS = 2;
  const MIN_CONSECUTIVE_ROWS = 3;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const items = (content.items as PdfTextItem[])
      .filter((item) => 'transform' in item && 'str' in item && item.str.trim())
      .sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > ROW_Y_THRESHOLD) return yDiff;
        return a.transform[4] - b.transform[4];
      });

    if (items.length === 0) continue;

    // Group items into rows by Y position
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentY = items[0].transform[5];

    for (const item of items) {
      const y = item.transform[5];
      if (Math.abs(y - currentY) > ROW_Y_THRESHOLD) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentY = y;
      }
      currentRow.push(item.str.trim());
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Find consecutive runs of rows with the same column count (>= MIN_COLS)
    let runStart = 0;
    while (runStart < rows.length) {
      const colCount = rows[runStart].length;
      if (colCount < MIN_COLS) {
        runStart++;
        continue;
      }

      let runEnd = runStart + 1;
      while (runEnd < rows.length && rows[runEnd].length === colCount) {
        runEnd++;
      }

      const runLength = runEnd - runStart;
      if (runLength >= MIN_CONSECUTIVE_ROWS) {
        tables.push({
          headers: rows[runStart],
          rows: rows.slice(runStart + 1, runEnd),
          pageNumber: pageNum,
        });
      }

      runStart = runEnd;
    }
  }

  return tables;
}
