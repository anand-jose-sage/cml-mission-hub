import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

// Server-only (Node runtime) — parses a raw PDF buffer into per-page text so
// chunks can carry an exact page number for citations.
export async function extractPdfPages(buffer: Buffer): Promise<ExtractedPage[]> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return text.map((pageText, i) => ({ pageNumber: i + 1, text: pageText }));
}
