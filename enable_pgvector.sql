-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add an embedding column to the service_providers table
-- Note: Google's text-embedding-004 model generates 768-dimensional vectors
alter table public.service_providers
add column if not exists embedding vector(768);

-- Create a function to search for matching service providers
-- We'll use cosine distance (<=>) for the semantic similarity
create or replace function public.match_service_providers (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  business_name text,
  category text,
  description text,
  similarity float
)
language sql stable
as $$
  select
    service_providers.id,
    service_providers.business_name,
    service_providers.category,
    service_providers.description,
    1 - (service_providers.embedding <=> query_embedding) as similarity
  from service_providers
  where 1 - (service_providers.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- Optional: Create an index for faster similarity searches (Recommended for production when you have many rows)
-- We use an HNSW index optimized for cosine distance
create index on public.service_providers 
using hnsw (embedding vector_cosine_ops);
