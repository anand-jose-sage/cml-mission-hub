-- ============================================================
-- RAG Document Q&A — documents, chunks, vector search
-- ============================================================
-- Run this in the Supabase SQL editor.
-- Reuses the existing public `cml-documents` storage bucket (see schema.sql)
-- for raw file storage. No public RLS policies are added on the two tables
-- below — all reads/writes go through the service-role client (server
-- actions / API route), since raw circular/manual text should not be
-- dumpable via the anon key.

create extension if not exists vector;

-- ============================================================
-- RAG_DOCUMENTS
-- ============================================================
create table if not exists rag_documents (
  id                 uuid        primary key default gen_random_uuid(),
  title              text        not null,
  document_type      text        not null check (document_type in (
    'annual_plan', 'state_circular', 'diocese_circular', 'meghala_circular',
    'shakha_guideline', 'competition_rules', 'quiz_rules', 'notification',
    'training_manual', 'formation_guide'
  )),
  year               int         not null,
  organization_level text        not null check (organization_level in ('State', 'Diocese', 'Meghala', 'Shakha')),
  language           text        not null check (language in ('Malayalam', 'English', 'Mixed')),
  competition        text        null check (competition in (
    'Speech', 'Quiz', 'Bible Quiz', 'Essay', 'Poem', 'Group Song',
    'Margamkali', 'Pencil Drawing', 'Mono Act', 'Other'
  )),
  month              text        null check (month in (
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  )),
  storage_path       text        not null,
  original_filename  text,
  status             text        not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  error_message      text,
  uploaded_by        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_rag_documents_status on rag_documents (status);
create index if not exists idx_rag_documents_type_year on rag_documents (document_type, year);

drop trigger if exists set_updated_at_rag_documents on rag_documents;
create trigger set_updated_at_rag_documents
  before update on rag_documents
  for each row execute function update_updated_at();

-- ============================================================
-- RAG_CHUNKS
-- ============================================================
create table if not exists rag_chunks (
  id                 uuid        primary key default gen_random_uuid(),
  document_id        uuid        not null references rag_documents(id) on delete cascade,
  chunk_index        int         not null,
  content            text        not null,
  page_number        int,
  embedding          vector(1536),
  -- denormalized from the parent document, for fast pre-filtering without a join
  document_type      text        not null,
  year               int         not null,
  organization_level text        not null,
  language           text        not null,
  competition        text,
  month              text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_rag_chunks_document on rag_chunks (document_id);
create index if not exists idx_rag_chunks_filters on rag_chunks (document_type, year, organization_level, competition, month);
create index if not exists idx_rag_chunks_embedding on rag_chunks using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- VECTOR SEARCH RPC
-- ============================================================
create or replace function match_rag_chunks(
  query_embedding vector(1536),
  filter jsonb default '{}'::jsonb,
  match_count int default 8
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page_number int,
  document_type text,
  year int,
  organization_level text,
  competition text,
  month text,
  similarity float
)
language sql stable
as $$
  select
    c.id, c.document_id, c.content, c.page_number,
    c.document_type, c.year, c.organization_level, c.competition, c.month,
    1 - (c.embedding <=> query_embedding) as similarity
  from rag_chunks c
  join rag_documents d on d.id = c.document_id and d.status = 'ready'
  where
    (filter->>'document_type' is null or c.document_type = filter->>'document_type')
    and (filter->>'year' is null or c.year = (filter->>'year')::int)
    and (filter->>'organization_level' is null or c.organization_level = filter->>'organization_level')
    and (filter->>'competition' is null or c.competition = filter->>'competition')
    and (filter->>'month' is null or c.month = filter->>'month')
  order by c.embedding <=> query_embedding
  limit match_count
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Enabled with no policies: only the service-role client (which bypasses
-- RLS) reads/writes these tables. There is intentionally no "Public read"
-- policy, unlike content_items/notices/activities.
alter table rag_documents enable row level security;
alter table rag_chunks enable row level security;
