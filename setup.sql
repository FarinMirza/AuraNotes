-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/gbztusrwbqoivyohhgcy/sql/new)
-- to set up the Aura Notes database.

create table public.notes (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  author_id text not null,
  author_name text not null,
  created_at timestamp with time zone default now(),
  color text,
  font_style text,
  likes integer default 0,
  supports integer default 0,
  hugs integer default 0,
  report_count integer default 0,
  hidden boolean default false
);

create table public.reports (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references public.notes(id) on delete cascade,
  reported_by text not null,
  reason text,
  timestamp timestamp with time zone default now()
);

-- Enable Realtime for the notes table
alter publication supabase_realtime add table notes;

-- Enable RLS
alter table public.notes enable row level security;
alter table public.reports enable row level security;

-- Policies for notes
create policy "Allow public viewing of notes" on public.notes
  for select using (not hidden);

create policy "Allow public posting of notes" on public.notes
  for insert with check (true);

create policy "Allow public updates for reactions and reports" on public.notes
  for update using (true);

-- Policies for reports
create policy "Allow public reporting" on public.reports
  for insert with check (true);
