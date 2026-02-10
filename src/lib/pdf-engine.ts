/**
 * Moteur d'extraction PDF haute fidelite.
 * Remplace pdf-parse par une extraction spatiale via pdfjs-dist.
 */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configurer le worker (necessaire pour pdfjs-dist dans Node)
if (typeof window === 'undefined') {
  // @ts-ignore
  pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
}

export interface PdfContent {
  text: string;
  metadata: any;
  numPages: number;
}

/**
 * Extrait le texte d'un PDF en preservant grossierement le layout spatial.
 * Cela aide l'IA a comprendre les tableaux et les structures de listes.
 */
export async function extractHighFidelityText(buffer: Buffer): Promise<PdfContent> {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  
  let fullText = '';
  const numPages = doc.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    
    // Filter to TextItem (has transform + str), then sort by position
    const items = (content.items as Array<{ str: string; transform: number[] }>)
      .filter((item) => 'transform' in item && 'str' in item)
      .sort((a, b) => {
        if (a.transform[5] !== b.transform[5]) {
          return b.transform[5] - a.transform[5]; // Descending Y
        }
        return a.transform[4] - b.transform[4]; // Ascending X
      });

    let lastY = -1;
    let pageText = '';

    for (const item of items) {
      if (lastY !== -1 && lastY !== item.transform[5]) {
        pageText += '\n';
      } else if (lastY !== -1) {
        pageText += ' '; // Add space between same-line items
      }
      pageText += item.str;
      lastY = item.transform[5];
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
