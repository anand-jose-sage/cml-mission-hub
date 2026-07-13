import type { ExtractedPage } from "./pdf-extract";

export interface Chunk {
  chunkIndex: number;
  content: string;
  pageNumber: number;
}

const TARGET_CHARS = 1500;
const OVERLAP_CHARS = 200;

// Character-based (not token-based) splitting: Malayalam/English-mixed text
// makes English-tuned token estimators unreliable, and chunk sizing here
// isn't billing-critical. Chunks never cross a page boundary so every chunk
// keeps an exact page number for citation.
function splitPage(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pieces: string[] = paragraphs.length > 0 ? paragraphs : (text.trim() ? [text.trim()] : []);

  // Break any paragraph that's still too long on sentence boundaries.
  const units: string[] = [];
  for (const piece of pieces) {
    if (piece.length <= TARGET_CHARS) {
      units.push(piece);
      continue;
    }
    const sentences = piece.split(/(?<=[.!?।])\s+/).filter(Boolean);
    units.push(...(sentences.length > 0 ? sentences : [piece]));
  }

  // Greedily pack units into ~TARGET_CHARS chunks with overlap.
  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    const candidate = current ? `${current}\n\n${unit}` : unit;
    if (candidate.length > TARGET_CHARS && current) {
      chunks.push(current);
      const overlapStart = Math.max(0, current.length - OVERLAP_CHARS);
      current = current.slice(overlapStart) + "\n\n" + unit;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

export function chunkPages(pages: ExtractedPage[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  for (const page of pages) {
    const pieces = splitPage(page.text);
    for (const content of pieces) {
      chunks.push({ chunkIndex: chunkIndex++, content, pageNumber: page.pageNumber });
    }
  }
  return chunks;
}
