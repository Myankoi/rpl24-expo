-- RPL Expo initial schema
-- Run once from Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum ('participant', 'admin');
create type public.project_status as enum ('draft', 'submitted', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  class_name text not null,
  role public.user_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  class_name text not null check (char_length(class_name) between 2 and 40),
  join_code text not null unique,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  slug text not null unique,
  tagline text not null check (char_length(tagline) between 2 and 160),
  description text not null check (char_length(description) between 20 and 3000),
  category text not null check (char_length(category) between 2 and 60),
  booth_number smallint unique check (booth_number between 1 and 14),
  cover_url text,
  demo_url text,
  repo_url text,
  status public.project_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  voter_hash text not null unique check (char_length(voter_hash) = 64),
  created_at timestamptz not null default now()
);

create table public.event_settings (
  singleton boolean primary key default true check (singleton),
  voting_open boolean not null default false,
  results_published boolean not null default false,
  event_status text not null default 'Persiapan',
  updated_at timestamptz not null default now()
);

insert into public.event_settings(singleton) values (true) on conflict do nothing;

create index projects_status_booth_idx on public.projects(status, booth_number);
create index votes_project_id_idx on public.votes(project_id);
create index team_members_team_id_idx on public.team_members(team_id);
create index teams_leader_id_idx on public.teams(leader_id);

-- One database round-trip per vote. The unique voter_hash constraint handles
-- concurrent submissions safely, including two requests arriving together.
create or replace function public.cast_vote(p_project_id uuid, p_voter_hash text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_voter_hash is null or char_length(p_voter_hash) <> 64 then
    return 'invalid_voter';
  end if;
  if not exists (select 1 from public.event_settings where singleton = true and voting_open = true) then
    return 'closed';
  end if;
  if not exists (select 1 from public.projects where id = p_project_id and status = 'approved') then
    return 'invalid_project';
  end if;
  begin
    insert into public.votes(project_id, voter_hash) values (p_project_id, p_voter_hash);
  exception when unique_violation then
    return 'duplicate';
  end;
  return 'success';
end;
$$;

revoke all on function public.cast_vote(uuid, text) from public, anon, authenticated;
grant execute on function public.cast_vote(uuid, text) to service_role;

create or replace function private.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function private.set_updated_at();
create trigger event_settings_set_updated_at before update on public.event_settings
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles(id, full_name, class_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'class_name', ''), 'Belum diisi')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

revoke execute on function private.set_updated_at() from public, anon, authenticated, service_role;
revoke execute on function private.handle_new_user() from public, anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.votes enable row level security;
alter table public.event_settings enable row level security;

create policy "approved projects are public"
on public.projects for select using (status = 'approved');

create policy "event state is public"
on public.event_settings for select using (true);

create policy "users can read own profile"
on public.profiles for select to authenticated using (id = (select auth.uid()));

create policy "users can update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Mutations use validated Next.js server endpoints with the service role key.
-- No public write policy is granted for teams, projects, event settings, or votes.

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-covers',
  'project-covers',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "project covers are public"
on storage.objects for select using (bucket_id = 'project-covers');

-- This application accesses project data only from trusted Next.js server code.
-- Explicit grants keep it working even when automatic Data API exposure is off.
grant usage on schema public to service_role;
grant select, insert, update, delete on
  public.profiles,
  public.teams,
  public.team_members,
  public.projects,
  public.votes,
  public.event_settings
to service_role;

revoke all on
  public.profiles,
  public.teams,
  public.team_members,
  public.projects,
  public.votes,
  public.event_settings
from anon, authenticated;
