-- Run this in Supabase SQL editor.
-- Uses the service role key for all writes, so RLS is enabled but locked down
-- (no anon inserts/updates except through our API routes, which use the service key).

create extension if not exists "pgcrypto";

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null,       -- path inside the private pdf bucket
  thumbnail_path text,              -- path inside the private pdf bucket (image)
  share_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null,       -- path inside the private image bucket
  thumbnail_path text,              -- optional smaller version, falls back to storage_path
  share_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now()
);

-- one row per page view / link open, for both files and images
create table if not exists events (
  id bigint generated always as identity primary key,
  item_type text not null check (item_type in ('file', 'image')),
  item_id uuid not null,
  event_type text not null check (event_type in ('view', 'link_click')),
  device_id text,
  created_at timestamptz not null default now()
);
create index if not exists events_item_idx on events (item_type, item_id);

-- one reaction per device per item (device can change their emoji, not stack them)
create table if not exists reactions (
  id bigint generated always as identity primary key,
  item_type text not null check (item_type in ('file', 'image')),
  item_id uuid not null,
  device_id text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (item_type, item_id, device_id)
);
create index if not exists reactions_item_idx on reactions (item_type, item_id);

alter table files enable row level security;
alter table images enable row level security;
alter table events enable row level security;
alter table reactions enable row level security;

-- No policies are created for anon/authenticated roles: the app talks to
-- Supabase exclusively through the server-side service role key, which
-- bypasses RLS. This keeps the tables completely inaccessible from the browser.
