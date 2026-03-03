-- JRB Field Notes — Database Schema
-- Run this in the Supabase SQL Editor to set up tables

-- Stores
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Team Members
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store_id uuid references stores(id) on delete cascade,
  role text not null default 'associate' check (role in ('manager', 'associate')),
  created_at timestamptz default now()
);

-- Feedback
create table feedback (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid references team_members(id) on delete cascade,
  category text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index idx_feedback_created_at on feedback(created_at desc);
create index idx_feedback_team_member on feedback(team_member_id);
create index idx_feedback_category on feedback(category);
create index idx_team_members_store on team_members(store_id);

-- Disable RLS (internal tool, no auth needed)
alter table stores enable row level security;
alter table team_members enable row level security;
alter table feedback enable row level security;

-- Allow all operations via anon key
create policy "Allow all on stores" on stores for all using (true) with check (true);
create policy "Allow all on team_members" on team_members for all using (true) with check (true);
create policy "Allow all on feedback" on feedback for all using (true) with check (true);
