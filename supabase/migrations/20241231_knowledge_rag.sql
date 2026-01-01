-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Create a table to store knowledge base items
create table if not exists knowledge_base (
    id uuid primary key default gen_random_uuid(),
    content text not null,
    category text,
    embedding vector(768),
    -- Gemini 1.5/2.0 Flash embedding dimension is 768
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- Enable Row Level Security (RLS)
alter table knowledge_base enable row level security;
-- Create a policy that allows anyone to read the knowledge base
create policy "Allow public read access" on knowledge_base for
select using (true);
-- Create a policy that allows only the service role to insert/update/delete
-- (This acts as "Admin Only" for now, or strictly backend/seed scripts)
create policy "Allow service role maintenance" on knowledge_base for all to service_role using (true) with check (true);
-- Create a function to search for knowledge items by similarity
create or replace function match_knowledge (
        query_embedding vector(768),
        match_threshold float,
        match_count int
    ) returns table (
        id uuid,
        content text,
        metadata jsonb,
        similarity float
    ) language plpgsql stable as $$ begin return query
select knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
from knowledge_base
where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
order by knowledge_base.embedding <=> query_embedding
limit match_count;
end;
$$;