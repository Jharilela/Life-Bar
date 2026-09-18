-- LifeBar EHR extensions: allergies, immunizations, a singleton profile
-- (emergency contact + care team), and lab result documents. Same
-- owner-scoped RLS pattern as 0001_init.sql.

create table allergies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  substance text not null,
  reaction text,
  severity text not null check (severity in ('mild', 'moderate', 'severe')),
  notes text,
  created_at timestamptz not null default now()
);

create table immunizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vaccine_name text not null,
  date_given date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table profile (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  care_provider_name text,
  care_provider_phone text,
  pharmacy_name text,
  pharmacy_phone text,
  updated_at timestamptz not null default now()
);

create table lab_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  test_name text not null,
  result_date date not null,
  summary text,
  file_path text,
  created_at timestamptz not null default now()
);

create index allergies_owner_idx on allergies (owner_id);
create index immunizations_owner_date_idx on immunizations (owner_id, date_given desc);
create index lab_results_owner_date_idx on lab_results (owner_id, result_date desc);

alter table allergies enable row level security;
alter table immunizations enable row level security;
alter table profile enable row level security;
alter table lab_results enable row level security;

create policy "allergies_owner_all" on allergies for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "immunizations_owner_all" on immunizations for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "profile_owner_all" on profile for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "lab_results_owner_all" on lab_results for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private bucket for lab result files, one folder per owner.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('lab-results', 'lab-results', false)
on conflict (id) do nothing;

create policy "lab_results_files_owner_select" on storage.objects for select
  using (bucket_id = 'lab-results' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "lab_results_files_owner_insert" on storage.objects for insert
  with check (bucket_id = 'lab-results' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "lab_results_files_owner_delete" on storage.objects for delete
  using (bucket_id = 'lab-results' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Extend the shared read-only summary with allergies, immunizations, and
-- the emergency contact / care team profile. Lab result files stay
-- owner-only — not exposed to anonymous share-link viewers.
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
    ), '[]'::jsonb),
    'allergies', coalesce((
      select jsonb_agg(a)
      from (
        select id, substance, reaction, severity, notes, created_at
        from allergies
        where owner_id = v_owner_id
        order by created_at desc
      ) a
    ), '[]'::jsonb),
    'immunizations', coalesce((
      select jsonb_agg(i)
      from (
        select id, vaccine_name, date_given, notes, created_at
        from immunizations
        where owner_id = v_owner_id
        order by date_given desc
      ) i
    ), '[]'::jsonb),
    'profile', (
      select to_jsonb(p) - 'owner_id' - 'updated_at'
      from profile p
      where p.owner_id = v_owner_id
    )
  ) into v_result;

  return v_result;
end;
$$;
