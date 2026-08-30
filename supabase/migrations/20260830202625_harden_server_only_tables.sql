-- Lock helper resolution and explicitly document tables that are only accessed
-- by trusted Next.js server code using the service role.
alter function private.set_updated_at() set search_path = '';

create policy "server only teams"
on public.teams for all to anon, authenticated
using (false) with check (false);

create policy "server only team members"
on public.team_members for all to anon, authenticated
using (false) with check (false);

create policy "server only votes"
on public.votes for all to anon, authenticated
using (false) with check (false);
