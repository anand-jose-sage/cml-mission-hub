"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { extractPdfPages } from "@/lib/rag/pdf-extract";
import { chunkPages } from "@/lib/rag/chunker";
import { embedTexts } from "@/lib/rag/embeddings";

export interface RagDocumentMeta {
  title: string;
  documentType: string;
  year: number;
  organizationLevel: string;
  language: string;
  competition: string | null;
  month: string | null;
  uploadedBy?: string;
}

export interface RagDocumentRow {
  id: string;
  title: string;
  document_type: string;
  year: number;
  organization_level: string;
  language: string;
  competition: string | null;
  month: string | null;
  original_filename: string | null;
  status: "processing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
}

export async function uploadRagDocument(
  file: File,
  meta: RagDocumentMeta
): Promise<{ documentId?: string; error?: string }> {
  const admin = getSupabaseAdmin();
  let documentId: string | undefined;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `rag/${meta.documentType}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadErr } = await admin.storage
      .from("cml-documents")
      .upload(storagePath, buffer, { contentType: file.type || "application/pdf" });
    if (uploadErr) {
      console.error("[uploadRagDocument] storage upload:", uploadErr.message);
      return { error: `Upload failed: ${uploadErr.message}` };
    }

    const { data: docRow, error: insertErr } = await admin
      .from("rag_documents")
      .insert({
        title: meta.title,
        document_type: meta.documentType,
        year: meta.year,
        organization_level: meta.organizationLevel,
        language: meta.language,
        competition: meta.competition,
        month: meta.month,
        storage_path: storagePath,
        original_filename: file.name,
        status: "processing",
        uploaded_by: meta.uploadedBy ?? null,
      })
      .select("id")
      .single();
    if (insertErr || !docRow) {
      console.error("[uploadRagDocument] insert:", insertErr?.message);
      return { error: `Could not create document record: ${insertErr?.message ?? "unknown error"}` };
    }
    documentId = docRow.id as string;

    await processDocument(documentId, meta);

    return { documentId };
  } catch (e) {
    console.error("[uploadRagDocument] unexpected:", e);
    if (documentId) {
      await admin
        .from("rag_documents")
        .update({ status: "failed", error_message: "Unexpected error during upload." })
        .eq("id", documentId);
    }
    return { error: "Something went wrong during upload." };
  }
}

// Extracts, chunks, embeds, and stores the chunks for a document already
// recorded in `rag_documents`. Shared by initial upload and reprocessing.
async function processDocument(documentId: string, meta: RagDocumentMeta): Promise<void> {
  const admin = getSupabaseAdmin();
  try {
    const { data: docRow, error: fetchErr } = await admin
      .from("rag_documents")
      .select("storage_path, document_type, year, organization_level, language, competition, month")
      .eq("id", documentId)
      .single();
    if (fetchErr || !docRow) {
      throw new Error(fetchErr?.message ?? "document not found");
    }

    const { data: fileBlob, error: downloadErr } = await admin.storage
      .from("cml-documents")
      .download(docRow.storage_path as string);
    if (downloadErr || !fileBlob) {
      throw new Error(downloadErr?.message ?? "could not download file");
    }
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    const pages = await extractPdfPages(buffer);
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
      throw new Error("No extractable text found in document.");
    }

    const embeddings = await embedTexts(chunks.map((c) => c.content));

    const rows = chunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      page_number: chunk.pageNumber,
      embedding: embeddings[i],
      document_type: docRow.document_type,
      year: docRow.year,
      organization_level: docRow.organization_level,
      language: docRow.language,
      competition: docRow.competition,
      month: docRow.month,
    }));

    // Clear any previous chunks (relevant for reprocessing).
    const { error: delErr } = await admin.from("rag_chunks").delete().eq("document_id", documentId);
    if (delErr) console.error("[processDocument] delete old chunks:", delErr.message);

    const { error: chunksErr } = await admin.from("rag_chunks").insert(rows);
    if (chunksErr) throw new Error(chunksErr.message);

    await admin.from("rag_documents").update({ status: "ready", error_message: null }).eq("id", documentId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Processing failed.";
    console.error("[processDocument] unexpected:", message);
    await admin.from("rag_documents").update({ status: "failed", error_message: message }).eq("id", documentId);
  }
}

export async function listRagDocuments(): Promise<{ data?: RagDocumentRow[]; error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { data, error } = await admin
      .from("rag_documents")
      .select("id, title, document_type, year, organization_level, language, competition, month, original_filename, status, error_message, created_at")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return { data: (data ?? []) as RagDocumentRow[] };
  } catch (e) {
    console.error("[listRagDocuments] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

export async function reprocessRagDocument(documentId: string): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { data: docRow, error: fetchErr } = await admin
      .from("rag_documents")
      .select("document_type, year, organization_level, language, competition, month, title")
      .eq("id", documentId)
      .single();
    if (fetchErr || !docRow) return { error: fetchErr?.message ?? "Document not found." };

    await admin.from("rag_documents").update({ status: "processing", error_message: null }).eq("id", documentId);

    await processDocument(documentId, {
      title: docRow.title as string,
      documentType: docRow.document_type as string,
      year: docRow.year as number,
      organizationLevel: docRow.organization_level as string,
      language: docRow.language as string,
      competition: docRow.competition as string | null,
      month: docRow.month as string | null,
    });

    return {};
  } catch (e) {
    console.error("[reprocessRagDocument] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

export async function deleteRagDocument(documentId: string): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { data: docRow } = await admin
      .from("rag_documents")
      .select("storage_path")
      .eq("id", documentId)
      .single();

    if (docRow?.storage_path) {
      const { error: storageErr } = await admin.storage.from("cml-documents").remove([docRow.storage_path as string]);
      if (storageErr) console.error("[deleteRagDocument] storage remove:", storageErr.message);
    }

    const { error } = await admin.from("rag_documents").delete().eq("id", documentId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[deleteRagDocument] unexpected:", e);
    return { error: "Something went wrong." };
  }
}
