-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Create a table to store your documents
create table if not exists embeddings (
    id bigserial primary key,
    content text,
    -- Represents the text content of the document
    metadata jsonb,
    -- Stores metadata like title, url, provider_id, etc.
    embedding vector(1536) -- OpenAI / Gemini embedding dimensionality (usually 1536)
);
-- Turn on RLS
alter table embeddings enable row level security;
-- Allow everyone to read (for RAG context) - Adjust restricted if needed
create policy "Allow public read access" on embeddings for
select to public using (true);
-- Allow authenticated users (or service role) to insert/update
create policy "Allow auth insert" on embeddings for
insert to authenticated with check (true);
-- Create a function to search for documents
create or replace function match_documents (
        query_embedding vector(1536),
        match_threshold float,
        match_count int
    ) returns table (
        id bigint,
        content text,
        metadata jsonb,
        similarity float
    ) language plpgsql as $$ begin return query
select embeddings.id,
    embeddings.content,
    embeddings.metadata,
    1 - (embeddings.embedding <=> query_embedding) as similarity
from embeddings
where 1 - (embeddings.embedding <=> query_embedding) > match_threshold
order by embeddings.embedding <=> query_embedding
limit match_count;
end;
$$;