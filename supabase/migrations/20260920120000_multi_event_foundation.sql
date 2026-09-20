-- Multi-edition foundation for RPL Expo.
-- This migration is intentionally additive: it preserves the legacy columns and
-- event_settings row for one release so the application can be rolled back safely.

create type public.event_status as enum (
  'draft',
  'registration',
  'review',
  'showcase',
  'voting',
  'closed',
  'published',
  'archived'
);

alter type public.project_status add value if not exists 'changes_requested';

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 2 and 120),
  year smallint not null check (year between 2000 and 2200),
  tagline text not null default 'Code. Create. Inspire.',
  description text not null default '',
  venue text not null default 'SMKN 24 Jakarta',
  contact text,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.event_status not null default 'draft',
  is_active boolean not null default false,
  team_min_size smallint not null default 1 check (team_min_size between 1 and 50),
  team_max_size smallint not null default 6 check (team_max_size between 1 and 50),
  enrollment_code_hash text,
  results_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (team_max_size >= team_min_size),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create unique index events_one_active_idx on public.events(is_active) where is_active = true;
create index events_status_idx on public.events(status, year desc);

insert into public.events (
  slug,
  display_name,
  year,
  description,
  venue,
  status,
  is_active,
  results_published
)
select
  'rpl-expo-2026',
  'RPL Expo 2026',
  2026,
  'Katalog proyek dan People''s Choice Voting RPL Expo 2026.',
  'SMKN 24 Jakarta',
  case
    when results_published then 'published'::public.event_status
    when voting_open then 'voting'::public.event_status
    when event_status = 'Voting selesai' then 'closed'::public.event_status
    else 'registration'::public.event_status
  end,
  true,
  results_published
from public.event_settings
where singleton = true
  and not exists (select 1 from public.events where slug = 'rpl-expo-2026');

alter table public.teams add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.team_members add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.projects add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.projects add column if not exists booth_label text;
alter table public.projects add column if not exists booth_id uuid;
alter table public.votes add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.votes add column if not exists ticket_id uuid;
alter table public.votes alter column voter_hash drop not null;

update public.teams
set event_id = e.id
from public.events e
where e.slug = 'rpl-expo-2026' and event_id is null;

update public.team_members tm
set event_id = t.event_id
from public.teams t
where t.id = tm.team_id and tm.event_id is null;

update public.projects p
set event_id = t.event_id,
    booth_label = case when p.booth_number is null then null else p.booth_number::text end
from public.teams t
where t.id = p.team_id and p.event_id is null;

update public.votes v
set event_id = p.event_id
from public.projects p
where p.id = v.project_id and v.event_id is null;

alter table public.teams alter column event_id set not null;
alter table public.team_members alter column event_id set not null;
alter table public.projects alter column event_id set not null;
alter table public.votes alter column event_id set not null;

alter table public.projects drop constraint if exists projects_booth_number_check;
alter table public.teams drop constraint if exists teams_join_code_key;
alter table public.team_members drop constraint if exists team_members_user_id_key;
alter table public.projects drop constraint if exists projects_team_id_key;
alter table public.projects drop constraint if exists projects_slug_key;
alter table public.projects drop constraint if exists projects_booth_number_key;
alter table public.votes drop constraint if exists votes_voter_hash_key;

create unique index teams_event_join_code_key on public.teams(event_id, join_code);
create unique index team_members_event_user_key on public.team_members(event_id, user_id);
create unique index projects_event_team_key on public.projects(event_id, team_id);
create unique index projects_event_slug_key on public.projects(event_id, slug);
create unique index projects_event_booth_number_key
  on public.projects(event_id, booth_number)
  where booth_number is not null;
create index teams_event_idx on public.teams(event_id, created_at desc);
create index projects_event_status_booth_idx on public.projects(event_id, status, booth_label);
create index votes_event_project_idx on public.votes(event_id, project_id);

create table public.event_enrollments (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_name text not null check (char_length(class_name) between 2 and 40),
  cohort_label text,
  enrolled_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

insert into public.event_enrollments(event_id, user_id, class_name)
select distinct on (tm.event_id, tm.user_id)
  tm.event_id,
  tm.user_id,
  coalesce(p.class_name, t.class_name, 'Belum diisi')
from public.team_members tm
join public.teams t on t.id = tm.team_id
left join public.profiles p on p.id = tm.user_id
on conflict (event_id, user_id) do nothing;

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, name),
  unique (event_id, id)
);

insert into public.event_categories(event_id, name, sort_order)
select e.id, c.category, row_number() over (order by c.category)
from public.events e
join (select distinct event_id, category from public.projects) c on c.event_id = e.id
on conflict (event_id, name) do nothing;

create table public.booths (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null check (char_length(code) between 1 and 30),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, code),
  unique (event_id, id)
);

insert into public.booths(event_id, code, sort_order)
select distinct p.event_id, p.booth_label, p.booth_number
from public.projects p
where p.booth_label is not null
on conflict (event_id, code) do nothing;

update public.projects p
set booth_id = b.id
from public.booths b
where b.event_id = p.event_id and b.code = p.booth_label and p.booth_id is null;

alter table public.projects
  add constraint projects_event_booth_fk
  foreign key (event_id, booth_id) references public.booths(event_id, id)
  on delete set null;
create unique index projects_event_booth_id_key
  on public.projects(event_id, booth_id)
  where booth_id is not null;

create table public.event_organizers (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

insert into public.event_organizers(event_id, user_id)
select e.id, p.id
from public.events e
cross join public.profiles p
where e.slug = 'rpl-expo-2026' and p.role = 'admin'
on conflict do nothing;

create table public.voting_ticket_batches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 100),
  quantity integer not null check (quantity between 1 and 10000),
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.voting_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  batch_id uuid references public.voting_ticket_batches(id) on delete set null,
  token_hash text,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index voting_tickets_token_hash_key
  on public.voting_tickets(token_hash)
  where token_hash is not null;
create index voting_tickets_event_idx on public.voting_tickets(event_id, redeemed_at);

alter table public.votes
  add constraint votes_ticket_fk
  foreign key (ticket_id) references public.voting_tickets(id) on delete restrict;
create unique index votes_event_ticket_key
  on public.votes(event_id, ticket_id)
  where ticket_id is not null;

create table public.event_results (
  event_id uuid primary key references public.events(id) on delete cascade,
  snapshot jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles(id) on delete set null
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 50),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_event_created_idx on public.audit_logs(event_id, created_at desc);

create or replace function public.cast_event_vote(
  p_event_id uuid,
  p_project_id uuid,
  p_ticket_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ticket_event uuid;
  ticket_redeemed timestamptz;
begin
  select event_id, redeemed_at
    into ticket_event, ticket_redeemed
  from public.voting_tickets
  where id = p_ticket_id
  for update;

  if ticket_event is null or ticket_event <> p_event_id then
    return 'invalid_ticket';
  end if;
  if ticket_redeemed is not null then
    return 'duplicate';
  end if;
  if not exists (
    select 1 from public.events
    where id = p_event_id and status = 'voting'
  ) then
    return 'closed';
  end if;
  if not exists (
    select 1 from public.projects
    where id = p_project_id and event_id = p_event_id and status = 'approved'
  ) then
    return 'invalid_project';
  end if;

  insert into public.votes(event_id, project_id, ticket_id)
  values (p_event_id, p_project_id, p_ticket_id);
  update public.voting_tickets set redeemed_at = now() where id = p_ticket_id;
  return 'success';
exception when unique_violation then
  return 'duplicate';
end;
$$;

revoke all on function public.cast_event_vote(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.cast_event_vote(uuid, uuid, uuid) to service_role;

alter table public.events enable row level security;
alter table public.event_enrollments enable row level security;
alter table public.event_categories enable row level security;
alter table public.booths enable row level security;
alter table public.event_organizers enable row level security;
alter table public.voting_ticket_batches enable row level security;
alter table public.voting_tickets enable row level security;
alter table public.event_results enable row level security;
alter table public.audit_logs enable row level security;

create policy "published event metadata is public"
on public.events for select
using (status in ('showcase', 'voting', 'closed', 'published', 'archived'));

create policy "published categories are public"
on public.event_categories for select
using (exists (select 1 from public.events e where e.id = event_id and e.status in ('showcase', 'voting', 'closed', 'published', 'archived')));

create policy "published booths are public"
on public.booths for select
using (exists (select 1 from public.events e where e.id = event_id and e.status in ('showcase', 'voting', 'closed', 'published', 'archived')));

create policy "published results are public"
on public.event_results for select
using (exists (select 1 from public.events e where e.id = event_id and e.status in ('published', 'archived')));

grant usage on schema public to service_role;
grant select, insert, update, delete on
  public.events,
  public.event_enrollments,
  public.event_categories,
  public.booths,
  public.event_organizers,
  public.voting_ticket_batches,
  public.voting_tickets,
  public.event_results,
  public.audit_logs
to service_role;

create trigger events_set_updated_at before update on public.events
for each row execute function private.set_updated_at();
