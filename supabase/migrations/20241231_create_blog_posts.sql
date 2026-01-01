create type blog_status as enum ('draft', 'published', 'archived');
create table if not exists blog_posts (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    content text,
    excerpt text,
    cover_image text,
    status blog_status default 'draft',
    author_id uuid references auth.users(id),
    tags text [],
    meta_title text,
    meta_description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS Policies
alter table blog_posts enable row level security;
create policy "Public can view published posts" on blog_posts for
select using (status = 'published');
create policy "Admins and Authors can manage posts" on blog_posts for all using (
    auth.uid() = author_id
    or exists (
        select 1
        from user_roles
        where user_id = auth.uid()
            and role = 'admin'
    )
);
-- Function to update updated_at
create or replace function update_updated_at_column() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language 'plpgsql';
create trigger update_blog_posts_updated_at before
update on blog_posts for each row execute procedure update_updated_at_column();