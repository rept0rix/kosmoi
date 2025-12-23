-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Create a table to store code chunks
create table if not exists code_knowledge (
    id bigserial primary key,
    path text not null,
    -- File path (e.g., "src/components/Button.jsx")
    content text not null,
    -- The actual code snippet
    checksum text,
    -- To prevent re-indexing unchanged files
    embedding vector(768),
    -- Gemini text-embedding-004 uses 768 dimensions
    metadata jsonb,
    -- Extra info (startLine, endLine, type)
    created_at timestamptz default now()
);
-- Index for faster semantic search
create index on code_knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);
-- Search function
create or replace function match_code_knowledge (
        query_embedding vector(768),
        match_threshold float,
        match_count int
    ) returns table (
        id bigint,
        path text,
        content text,
        similarity float
    ) language plpgsql as $$ begin return query
select code_knowledge.id,
    code_knowledge.path,
    code_knowledge.content,
    1 - (code_knowledge.embedding <=> query_embedding) as similarity
from code_knowledge
where 1 - (code_knowledge.embedding <=> query_embedding) > match_threshold
order by code_knowledge.embedding <=> query_embedding
limit match_count;
end;
$$;