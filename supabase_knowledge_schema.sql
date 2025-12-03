-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store the "Shared Brain" knowledge
create table if not exists agent_knowledge (
  id bigint primary key generated always as identity,
  agent_id text not null, -- Who contributed this knowledge
  content text not null, -- The actual text/insight
  metadata jsonb default '{}'::jsonb, -- Extra context (e.g., source file, tags)
  embedding vector(768), -- Vector embedding for semantic search (Gemini dimensions)
  created_at timestamp with time zone default now()
);

-- Create a function to search for knowledge by similarity
create or replace function match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  agent_id text,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    agent_knowledge.id,
    agent_knowledge.agent_id,
    agent_knowledge.content,
    agent_knowledge.metadata,
    1 - (agent_knowledge.embedding <=> query_embedding) as similarity
  from agent_knowledge
  where 1 - (agent_knowledge.embedding <=> query_embedding) > match_threshold
  order by agent_knowledge.embedding <=> query_embedding
  limit match_count;
end;
$$;
