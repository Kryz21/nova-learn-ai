-- Novalearn AI — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('file', 'notes', 'youtube')),
  source_meta jsonb default '{}'::jsonb,
  status text not null default 'ready' check (status in ('processing', 'ready', 'error')),
  notes_json jsonb,
  quiz_json jsonb,
  flashcards_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "Users can view their own resources"
  on public.resources for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resources"
  on public.resources for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resources"
  on public.resources for update
  using (auth.uid() = user_id);

create policy "Users can delete their own resources"
  on public.resources for delete
  using (auth.uid() = user_id);

create index if not exists resources_user_id_idx on public.resources(user_id);
create index if not exists resources_created_at_idx on public.resources(created_at desc);
