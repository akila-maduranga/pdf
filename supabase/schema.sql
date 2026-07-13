-- Run this in Supabase SQL editor.
-- Uses the service role key for all writes, so RLS is enabled but locked down
-- (no anon inserts/updates except through our API routes, which use the service key).

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null,       -- path inside the private pdf bucket
  thumbnail_path text,              -- path inside the private pdf bucket (image)
  share_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null,       -- path inside the private image bucket
  thumbnail_path text,              -- optional smaller version, falls back to storage_path
  share_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

-- A collection groups several files/images together as "parts" of one
-- story (e.g. chapters, issues, a photo series). Order is controlled by
-- part_number.
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  share_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists collection_items (
  id bigint generated always as identity primary key,
  collection_id uuid not null references collections(id) on delete cascade,
  item_type text not null check (item_type in ('file', 'image')),
  item_id uuid not null,
  part_number integer not null default 1,
  created_at timestamptz not null default now(),
  unique (collection_id, item_type, item_id)
);
create index if not exists collection_items_collection_idx on collection_items (collection_id, part_number);
create index if not exists collection_items_item_idx on collection_items (item_type, item_id);

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

alter table categories enable row level security;
alter table files enable row level security;
alter table images enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table events enable row level security;
alter table reactions enable row level security;

-- No policies are created for anon/authenticated roles: the app talks to
-- Supabase exclusively through the server-side service role key, which
-- bypasses RLS. This keeps the tables completely inaccessible from the browser.

-- If you already had this schema deployed before categories/collections
-- existed, the "create table if not exists" statements above will add the
-- new tables, but won't add the new column to pre-existing files/images
-- tables. These are safe to re-run:
alter table files add column if not exists category_id uuid references categories(id) on delete set null;
alter table images add column if not exists category_id uuid references categories(id) on delete set null;
