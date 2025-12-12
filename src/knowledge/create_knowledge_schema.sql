-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Create the agent_knowledge table
create table if not exists agent_knowledge (
    id bigint primary key generated always as identity,
    content text not null,
    metadata jsonb,
    -- Flexible metadata (e.g., source, author, date)
    embedding vector(1536),
    -- Dimension for OpenAI/Gemini embeddings (adjust if needed)
    category text,
    tags text [],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by text -- Agent ID
);
-- Create a function to search for knowledge (Keyword + Semantic Hybrid Placeholder)
-- Note: Real semantic search requires generating embeddings. 
-- For now, we will use a simple text search or assume embeddings are passed.
create or replace function match_knowledge (
        query_embedding vector(1536),
        match_threshold float,
        match_count int
    ) returns table (
        id bigint,
        content text,
        metadata jsonb,
        similarity float
    ) language plpgsql as $$ begin return query
select agent_knowledge.id,
    agent_knowledge.content,
    agent_knowledge.metadata,
    1 - (agent_knowledge.embedding <=> query_embedding) as similarity
from agent_knowledge
where 1 - (agent_knowledge.embedding <=> query_embedding) > match_threshold
order by agent_knowledge.embedding <=> query_embedding
limit match_count;
end;
$$;
-- Enable RLS
alter table agent_knowledge enable row level security;
-- Allow all agents (authenticated) to read/write
create policy "Enable all access for authenticated users" on agent_knowledge for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- Also allow anon for dev mode if needed (Optional)
create policy "Enable read access for anon" on agent_knowledge for
select using (true);