-- LifeBar schema: self-reported visits, medications, adherence logs,
-- measurements, and the two sharing mechanisms (tokenized links, persistent
-- grants). Every health table is owner-scoped by Row Level Security; there is
-- no admin/service role path into another person's data in this schema.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table visits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visit_date date not null,
  doctor_name text not null,
  specialty text,
  reason text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visit_id uuid references visits (id) on delete set null,
  name text not null,
  dosage text,
  frequency text,
  status text not null default 'active' check (status in ('active', 'completed', 'stopped')),
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now()
);

create table medication_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  medication_id uuid not null references medications (id) on delete cascade,
  log_date date not null,
  taken boolean not null default true,
  created_at timestamptz not null default now(),
  unique (medication_id, log_date)
);

create table measurements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (
    type in ('blood_pressure', 'glucose', 'weight', 'heart_rate', 'temperature', 'spo2', 'custom')
  ),
  label text,
  value numeric not null,
  value_secondary numeric,
  unit text not null default '',
  taken_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token text not null unique,
  label text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table share_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  grantee_email text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, grantee_email)
);

create index visits_owner_idx on visits (owner_id, visit_date desc);
create index medications_owner_idx on medications (owner_id);
create index medications_visit_idx on medications (visit_id);
create index medication_logs_owner_idx on medication_logs (owner_id);
create index medication_logs_medication_idx on medication_logs (medication_id, log_date desc);
create index measurements_owner_type_idx on measurements (owner_id, type, taken_at desc);
create index share_links_token_idx on share_links (token);
create index share_grants_email_idx on share_grants (lower(grantee_email));

-- ---------------------------------------------------------------------------
-- Shared-access helper
--
-- security definer so it can read share_grants (owner-only RLS below)
-- while being called from within another table's policy.
-- ---------------------------------------------------------------------------

create or replace function public.has_shared_access(p_owner_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from share_grants g
    where g.owner_id = p_owner_id
      and g.revoked_at is null
      and lower(g.grantee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table visits enable row level security;
alter table medications enable row level security;
alter table medication_logs enable row level security;
alter table measurements enable row level security;
alter table share_links enable row level security;
alter table share_grants enable row level security;

create policy "visits_select" on visits for select
  using (owner_id = auth.uid() or public.has_shared_access(owner_id));
create policy "visits_insert" on visits for insert
  with check (owner_id = auth.uid());
create policy "visits_update" on visits for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "visits_delete" on visits for delete
  using (owner_id = auth.uid());

create policy "medications_select" on medications for select
  using (owner_id = auth.uid() or public.has_shared_access(owner_id));
create policy "medications_insert" on medications for insert
  with check (owner_id = auth.uid());
create policy "medications_update" on medications for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "medications_delete" on medications for delete
  using (owner_id = auth.uid());

create policy "medication_logs_select" on medication_logs for select
  using (owner_id = auth.uid() or public.has_shared_access(owner_id));
create policy "medication_logs_insert" on medication_logs for insert
  with check (owner_id = auth.uid());
create policy "medication_logs_update" on medication_logs for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "medication_logs_delete" on medication_logs for delete
  using (owner_id = auth.uid());

create policy "measurements_select" on measurements for select
  using (owner_id = auth.uid() or public.has_shared_access(owner_id));
create policy "measurements_insert" on measurements for insert
  with check (owner_id = auth.uid());
create policy "measurements_update" on measurements for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "measurements_delete" on measurements for delete
  using (owner_id = auth.uid());

-- Share links and grants are never readable by anyone but their owner.
-- Token-based viewing goes through get_shared_summary() below instead.
create policy "share_links_owner_all" on share_links for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "share_grants_owner_all" on share_grants for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Token-based read-only summary, for the /share/[token] page. Runs as the
-- function owner (bypassing RLS) so an anonymous viewer with a valid,
-- unexpired, unrevoked token can read one person's data without an account.
-- ---------------------------------------------------------------------------

create or replace function public.get_shared_summary(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_result jsonb;
begin
  select owner_id into v_owner_id
  from share_links
  where token = p_token
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_owner_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'visits', coalesce((
      select jsonb_agg(v)
      from (
        select id, visit_date, doctor_name, specialty, reason, notes, created_at
        from visits
        where owner_id = v_owner_id
        order by visit_date desc
        limit 20
      ) v
    ), '[]'::jsonb),
    'medications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'dosage', m.dosage,
        'frequency', m.frequency,
        'status', m.status,
        'start_date', m.start_date,
        'end_date', m.end_date,
        'logs', coalesce((
          select jsonb_agg(jsonb_build_object('log_date', l.log_date, 'taken', l.taken))
          from medication_logs l
          where l.medication_id = m.id
            and l.log_date >= (current_date - interval '30 days')
        ), '[]'::jsonb)
      ))
      from medications m
      where m.owner_id = v_owner_id
    ), '[]'::jsonb),
    'measurements', coalesce((
      select jsonb_agg(x)
      from (
        select id, type, label, value, value_secondary, unit, taken_at, note
        from measurements
        where owner_id = v_owner_id
        order by taken_at desc
        limit 60
      ) x
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.has_shared_access(uuid) to authenticated;
grant execute on function public.get_shared_summary(text) to anon, authenticated;
