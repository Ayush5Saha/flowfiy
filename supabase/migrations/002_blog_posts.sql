do $$
begin
  create type "BlogPostStatus" as enum ('DRAFT', 'PUBLISHED');
exception
  when duplicate_object then null;
end $$;

create extension if not exists pgcrypto;

create table if not exists blog_posts (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  category text not null,
  content text not null,
  status "BlogPostStatus" not null default 'DRAFT',
  author_name text not null default 'Flowfiy',
  read_time text not null default '5 min read',
  is_featured boolean not null default false,
  seo_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_at_idx
  on blog_posts (status, published_at);

alter table blog_posts enable row level security;
