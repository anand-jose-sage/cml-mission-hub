import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { embedText } from "@/lib/rag/embeddings";
import { inferFilters } from "@/lib/rag/infer-filters";

export const runtime = "nodejs";

const CHAT_MODEL = "claude-sonnet-5";
const MATCH_COUNT = 8;
const FALLBACK_SENTENCE = "I couldn't find this information in the available official CML documents.";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MatchedChunk {
  content: string;
  page_number: number | null;
  document_id: string;
}

const SYSTEM_PROMPT = `You are the official CML (Cherupushpa Mission League, Kalpetta) document help desk.
Answer only using the "Retrieved context" the user provides in their message — never use
outside/general knowledge for operational questions (calendars, circulars, rules, guidelines).

Style:
- Be concise. Use bullet points when listing rules or activities.
- Preserve official wording where appropriate.
- Always cite the source after each factual claim, in the form "(<document title>, p.<page>)".
  If a page number isn't available, cite just the document title.
- Clearly distinguish mandatory rules ("must"/"shall") from recommendations ("should"/"may").
- Respond in the same language as the question (Malayalam, English, or a mix).

For competition questions, when present in the context, cover: eligibility, age/category,
number of participants, time limit, materials allowed, judging criteria, important
restrictions, and the source + page.

For activity/programme questions, when present in the context, cover: activity name, date,
level (State/Diocese/Meghala/Shakha), target participants, objectives, instructions, and
the source.

If retrieved documents conflict, prefer the newest (by year), mention both, and cite each.

If the retrieved context does not contain the answer, respond with exactly this sentence
and nothing else: "${FALLBACK_SENTENCE}"
Do not invent rules, dates, or figures that are not present in the retrieved context.`;

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

async function searchChunks(queryEmbedding: number[], filter: object): Promise<MatchedChunk[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("match_rag_chunks", {
    query_embedding: queryEmbedding,
    filter,
    match_count: MATCH_COUNT,
  });
  if (error) {
    console.error("[chat] match_rag_chunks:", error.message);
    return [];
  }
  return (data ?? []) as MatchedChunk[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message ?? "";
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-6) : [];

    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const inferred = inferFilters(message);
    const queryEmbedding = await embedText(message);

    let matches = await searchChunks(queryEmbedding, inferred);
    if (matches.length === 0 && Object.keys(inferred).length > 0) {
      // Fallback: retry with no metadata filter (unfiltered semantic search).
      matches = await searchChunks(queryEmbedding, {});
    }

    if (matches.length === 0) {
      return NextResponse.json({ answer: FALLBACK_SENTENCE, citations: [] });
    }

    const documentIds = Array.from(new Set(matches.map((m) => m.document_id)));
    const admin = getSupabaseAdmin();
    const { data: docs } = await admin
      .from("rag_documents")
      .select("id, title")
      .in("id", documentIds);
    const titleById = new Map((docs ?? []).map((d) => [d.id as string, d.title as string]));

    const contextBlock = matches
      .map((m, i) => {
        const title = titleById.get(m.document_id) ?? "Unknown document";
        const page = m.page_number ? `, p.${m.page_number}` : "";
        return `[${i + 1}] ${title}${page}\n${m.content}`;
      })
      .join("\n\n---\n\n");

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user" as const,
          content: `Question: ${message}\n\nRetrieved context:\n${contextBlock}`,
        },
      ],
    });

    const answer = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const citations = documentIds.map((id) => ({
      documentTitle: titleById.get(id) ?? "Unknown document",
      pageNumber: matches.find((m) => m.document_id === id)?.page_number ?? null,
    }));

    return NextResponse.json({ answer, citations });
  } catch (err: unknown) {
    console.error("[chat] unexpected:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
