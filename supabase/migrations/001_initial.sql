-- NutriCheck DB Schema
-- Run in Supabase SQL Editor

-- Drop only our app's tables if they exist to avoid conflict and support clean reinstalls
drop table if exists nutri_receipts cascade;
drop table if exists nutri_family_members cascade;
drop table if exists nutri_families cascade;

create extension if not exists "uuid-ossp";

-- Families
create table if not exists nutri_families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Family members
create table if not exists nutri_family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references nutri_families(id) on delete cascade,
  name text not null,
  age integer not null default 30,
  weight numeric not null default 70,
  height numeric not null default 170,
  goal text not null default 'maintain' check (goal in ('maintain','lose','gain')),
  daily_calories integer not null default 2000,
  created_at timestamptz default now()
);

-- Receipts (stores parsed result as JSON for flexibility)
create table if not exists nutri_receipts (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references nutri_families(id) on delete cascade,
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
alter table nutri_families enable row level security;
alter table nutri_family_members enable row level security;
alter table nutri_receipts enable row level security;

-- Public access policies (for prototype — restrict in production!)
create policy "Allow all on nutri_families" on nutri_families for all using (true);
create policy "Allow all on nutri_family_members" on nutri_family_members for all using (true);
create policy "Allow all on nutri_receipts" on nutri_receipts for all using (true);

-- Index for performance
create index if not exists nutri_receipts_family_id_idx on nutri_receipts(family_id);
create index if not exists nutri_receipts_created_at_idx on nutri_receipts(created_at desc);
create index if not exists nutri_family_members_family_id_idx on nutri_family_members(family_id);
