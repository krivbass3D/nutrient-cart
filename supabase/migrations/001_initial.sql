-- NutriCheck DB Schema
-- Run in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Families
create table if not exists families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Family members
create table if not exists family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  name text not null,
  age integer not null default 30,
  weight numeric not null default 70,
  height numeric not null default 170,
  goal text not null default 'maintain' check (goal in ('maintain','lose','gain')),
  daily_calories integer not null default 2000,
  created_at timestamptz default now()
);

-- Receipts (stores parsed result as JSON for flexibility)
create table if not exists receipts (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  store text not null default 'Unknown',
  date text,
  total numeric not null default 0,
  currency text not null default 'EUR',
  items jsonb not null default '[]'::jsonb,
  total_nutrition jsonb not null default '{}'::jsonb,
  macro_percent jsonb not null default '{}'::jsonb,
  recommendations text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table families enable row level security;
alter table family_members enable row level security;
alter table receipts enable row level security;

-- Public access policies (for prototype — restrict in production!)
create policy "Allow all on families" on families for all using (true);
create policy "Allow all on family_members" on family_members for all using (true);
create policy "Allow all on receipts" on receipts for all using (true);

-- Index for performance
create index if not exists receipts_family_id_idx on receipts(family_id);
create index if not exists receipts_created_at_idx on receipts(created_at desc);
create index if not exists family_members_family_id_idx on family_members(family_id);
